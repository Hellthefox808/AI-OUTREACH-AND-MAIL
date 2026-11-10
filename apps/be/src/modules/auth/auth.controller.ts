/**
 * Auth controller.
 *
 * Endpoints:
 *   POST /v1/auth/register
 *   POST /v1/auth/login
 *   POST /v1/auth/logout
 *   POST /v1/auth/sessions/revoke-all
 *   POST /v1/auth/refresh
 *   POST /v1/auth/password-reset-request
 *   POST /v1/auth/password-reset-confirm
 *   POST /v1/auth/mfa/enroll
 *   POST /v1/auth/mfa/verify
 *   POST /v1/auth/mfa/disable
 *   GET  /v1/auth/me
 *
 * Access and refresh tokens are set as HTTP-only secure cookies so they never
 * touch frontend localStorage or extension storage. Public endpoints bypass AuthGuard.
 */

import {
  Controller,
  Post,
  Body,
  Get,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { Response, Request } from "express";
import { ApiTags, ApiOperation, ApiBody, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { z } from "zod";
import { AuthService } from "./auth.service";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { UnauthorizedError } from "@career-intelligence/shared";
import { Public, WorkspaceAgnostic } from "../../common/decorators";

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
  workspaceSlug: z.string().optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const PasswordResetRequestSchema = z.object({
  email: z.string().email(),
});

const PasswordResetConfirmSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8),
});

const MfaVerifySchema = z.object({
  token: z.string().length(6),
});

type RegisterInput = z.infer<typeof RegisterSchema>;
type LoginInput = z.infer<typeof LoginSchema>;
type PasswordResetRequestInput = z.infer<typeof PasswordResetRequestSchema>;
type PasswordResetConfirmInput = z.infer<typeof PasswordResetConfirmSchema>;
type MfaVerifyInput = z.infer<typeof MfaVerifySchema>;

@ApiTags("auth")
@Controller("auth")
@WorkspaceAgnostic()
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post("register")
  @ApiOperation({ summary: "Register a new user and workspace" })
  @ApiBody({ schema: { type: "object", properties: { email: { type: "string" }, password: { type: "string" }, name: { type: "string" }, workspaceSlug: { type: "string" } } } })
  @ApiResponse({ status: 201, description: "Registered" })
  @HttpCode(HttpStatus.CREATED)
  async register(@Body(new ZodValidationPipe(RegisterSchema)) body: RegisterInput, @Res() res: Response) {
    const result = await this.auth.register(body);
    this.setTokenCookies(res, result.accessToken, result.refreshToken);
    return res.status(201).json(result);
  }

  @Public()
  @Post("login")
  @ApiOperation({ summary: "Authenticate user and issue session tokens" })
  @ApiBody({ schema: { type: "object", properties: { email: { type: "string" }, password: { type: "string" } } } })
  @ApiResponse({ status: 200, description: "Authenticated" })
  @HttpCode(HttpStatus.OK)
  async login(@Body(new ZodValidationPipe(LoginSchema)) body: LoginInput, @Res() res: Response) {
    const result = await this.auth.login(body);
    this.setTokenCookies(res, result.accessToken, result.refreshToken);
    return res.json({ user: result.user, accessToken: result.accessToken });
  }

  @Post("logout")
  @ApiOperation({ summary: "Logout and revoke current session" })
  @ApiResponse({ status: 200, description: "Logged out" })
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res() res: Response) {
    let token = req.cookies?.access_token;
    if (!token && typeof req.headers.authorization === "string") {
      const [scheme, credentials] = req.headers.authorization.split(" ");
      if (scheme?.toLowerCase() === "bearer" && credentials) {
        token = credentials.trim();
      }
    }
    if (token) {
      await this.auth.logout(token);
    }
    this.clearTokenCookies(res);
    return res.json({ revoked: true });
  }

  @ApiBearerAuth()
  @Post("sessions/revoke-all")
  @ApiOperation({ summary: "Revoke all sessions for the current user" })
  @ApiResponse({ status: 200, description: "All sessions revoked" })
  @HttpCode(HttpStatus.OK)
  async revokeAll(@Req() req: Request, @Res() res: Response) {
    const user = (req as any).user;
    if (!user) {
      throw new UnauthorizedError();
    }
    await this.auth.revokeAllSessions(user.id);
    this.clearTokenCookies(res);
    return res.json({ revoked: true });
  }

  @Public()
  @Post("refresh")
  @ApiOperation({ summary: "Refresh access and refresh tokens" })
  @ApiBody({ schema: { type: "object", properties: { refresh_token: { type: "string" } } } })
  @ApiResponse({ status: 200, description: "Tokens refreshed" })
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Body("refresh_token") bodyRefreshToken: string | undefined,
    @Res() res: Response,
  ) {
    const refreshToken = req.cookies?.refresh_token || bodyRefreshToken;
    if (!refreshToken) {
      throw new UnauthorizedError("Refresh token required");
    }
    const result = await this.auth.refreshTokens(refreshToken);
    this.setTokenCookies(res, result.accessToken, result.refreshToken);
    return res.json({ user: result.user, accessToken: result.accessToken });
  }

  @Public()
  @Post("password-reset-request")
  @ApiOperation({ summary: "Request a password reset token" })
  @ApiBody({ schema: { type: "object", properties: { email: { type: "string" } } } })
  @ApiResponse({ status: 200, description: "Reset token issued (generic)" })
  @HttpCode(HttpStatus.OK)
  async passwordResetRequest(@Body(new ZodValidationPipe(PasswordResetRequestSchema)) body: PasswordResetRequestInput) {
    return this.auth.passwordResetRequest(body.email);
  }

  @Public()
  @Post("password-reset-confirm")
  @ApiOperation({ summary: "Confirm password reset with token" })
  @ApiBody({ schema: { type: "object", properties: { token: { type: "string" }, newPassword: { type: "string" } } } })
  @ApiResponse({ status: 200, description: "Password reset" })
  @HttpCode(HttpStatus.OK)
  async passwordResetConfirm(@Body(new ZodValidationPipe(PasswordResetConfirmSchema)) body: PasswordResetConfirmInput) {
    return this.auth.passwordResetConfirm(body.token, body.newPassword);
  }

  @ApiBearerAuth()
  @Post("mfa/enroll")
  @ApiOperation({ summary: "Begin TOTP MFA enrollment" })
  @ApiResponse({ status: 200, description: "Enrollment data" })
  @HttpCode(HttpStatus.OK)
  async mfaEnroll(@Req() req: Request) {
    const user = (req as any).user;
    if (!user) {
      throw new UnauthorizedError();
    }
    return this.auth.mfaEnroll(user.id);
  }

  @ApiBearerAuth()
  @Post("mfa/verify")
  @ApiOperation({ summary: "Verify TOTP token and enable MFA" })
  @ApiBody({ schema: { type: "object", properties: { token: { type: "string" } } } })
  @ApiResponse({ status: 200, description: "MFA verified" })
  @HttpCode(HttpStatus.OK)
  async mfaVerify(@Req() req: Request, @Body(new ZodValidationPipe(MfaVerifySchema)) body: MfaVerifyInput) {
    const user = (req as any).user;
    if (!user) {
      throw new UnauthorizedError();
    }
    return this.auth.mfaVerify(user.id, body.token);
  }

  @ApiBearerAuth()
  @Post("mfa/disable")
  @ApiOperation({ summary: "Disable TOTP MFA" })
  @ApiResponse({ status: 200, description: "MFA disabled" })
  @HttpCode(HttpStatus.OK)
  async mfaDisable(@Req() req: Request) {
    const user = (req as any).user;
    if (!user) {
      throw new UnauthorizedError();
    }
    return this.auth.mfaDisable(user.id);
  }

  @ApiBearerAuth()
  @Get("me")
  @ApiOperation({ summary: "Get current authenticated user" })
  @ApiResponse({ status: 200, description: "Current user" })
  async me(@Req() req: Request) {
    const user = (req as any).user;
    if (!user) {
      return { authenticated: false };
    }
    return { authenticated: true, user };
  }

  private setTokenCookies(res: Response, accessToken: string, refreshToken: string) {
    const isProd = process.env.NODE_ENV === "production";
    res.cookie("access_token", accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      path: "/",
      maxAge: 15 * 60 * 1000,
    });
    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  private clearTokenCookies(res: Response) {
    res.clearCookie("access_token", { path: "/" });
    res.clearCookie("refresh_token", { path: "/" });
  }
}
