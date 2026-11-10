import { describe, it, expect } from "vitest";
import {
  id,
  type CompanyId,
  type WorkspaceId,
  VERIFICATION_STATUSES,
  VerificationStatusSchema,
  COMPANY_TIERS,
  CompanyTierSchema,
  JOB_TYPES,
  JobTypeSchema,
  WORK_MODES,
  WorkModeSchema,
  INDUSTRIES,
  IndustrySchema,
  SEQUENCE_STATES,
  SequenceStateSchema,
  REPLY_CLASSIFICATIONS,
  ReplyClassificationSchema,
  PaginationQuerySchema,
  createPaginatedResultSchema,
  encodeCursor,
  decodeCursor,
  CreateCompanySchema,
  CreateRecruiterSchema,
  CreateJobPostingSchema,
  CreateWorkspaceSchema,
  RegisterSchema,
  LoginSchema,
  AppError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  ValidationError,
  PERMISSIONS,
} from "./index";

describe("packages/shared - Domain Contracts & Schemas", () => {
  describe("Branded IDs", () => {
    it("should cast primitive string to branded ID without runtime mutation", () => {
      const companyId = id<CompanyId>("cmp_9941a2");
      const workspaceId = id<WorkspaceId>("ws_alpha_01");

      expect(companyId).toBe("cmp_9941a2");
      expect(workspaceId).toBe("ws_alpha_01");
      expect(typeof companyId).toBe("string");
    });
  });

  describe("Enumeration Schemas", () => {
    it("should validate all VerificationStatus enum values", () => {
      for (const status of VERIFICATION_STATUSES) {
        expect(VerificationStatusSchema.parse(status)).toBe(status);
      }
      expect(() => VerificationStatusSchema.parse("NON_EXISTENT")).toThrow();
    });

    it("should validate all CompanyTier enum values", () => {
      for (const tier of COMPANY_TIERS) {
        expect(CompanyTierSchema.parse(tier)).toBe(tier);
      }
      expect(() => CompanyTierSchema.parse("TIER_4")).toThrow();
    });

    it("should validate JobType and WorkMode schemas", () => {
      for (const type of JOB_TYPES) {
        expect(JobTypeSchema.parse(type)).toBe(type);
      }
      for (const mode of WORK_MODES) {
        expect(WorkModeSchema.parse(mode)).toBe(mode);
      }
      expect(() => JobTypeSchema.parse("freelance_gig")).toThrow();
      expect(() => WorkModeSchema.parse("anywhere")).toThrow();
    });

    it("should validate Industries, Sequences, and Reply classifications", () => {
      expect(IndustrySchema.parse("ai_ml")).toBe("ai_ml");
      expect(SequenceStateSchema.parse("ACTIVE")).toBe("ACTIVE");
      expect(ReplyClassificationSchema.parse("INTERESTED")).toBe("INTERESTED");
      expect(() => IndustrySchema.parse("space_mining")).toThrow();
      expect(() => SequenceStateSchema.parse("UNKNOWN")).toThrow();
      expect(() => ReplyClassificationSchema.parse("MAYBE")).toThrow();
    });
  });

  describe("Cursor Encoding & Decoding", () => {
    it("should encode and decode a string ObjectId in URL-safe base64url format", () => {
      const rawId = "672f9a12bcf86cd799439011";
      const encoded = encodeCursor(rawId);

      // Verify URL-safe characteristics (no +, /, or trailing =)
      expect(encoded).not.toContain("+");
      expect(encoded).not.toContain("/");
      expect(encoded).not.toContain("=");

      const decoded = decodeCursor<string>(encoded);
      expect(decoded).toBe(rawId);
    });

    it("should encode and decode composite keyset cursor objects", () => {
      const compositeKeyset = {
        _id: "672f9a12bcf86cd799439011",
        createdAt: "2026-11-10T08:00:00.000Z",
        tier: "TIER_1",
      };

      const encoded = encodeCursor(compositeKeyset);
      expect(typeof encoded).toBe("string");

      const decoded = decodeCursor<typeof compositeKeyset>(encoded);
      expect(decoded).toEqual(compositeKeyset);
      expect(decoded._id).toBe("672f9a12bcf86cd799439011");
      expect(decoded.tier).toBe("TIER_1");
    });

    it("should handle plain string fallback when decodeCursor receives invalid JSON", () => {
      const plainStr = "plain-cursor-text";
      const encoded = encodeCursor(plainStr);
      const decoded = decodeCursor(encoded);
      expect(decoded).toBe(plainStr);
    });
  });

  describe("Pagination Schemas", () => {
    it("should coerce string query params and apply default pagination values", () => {
      const parsed = PaginationQuerySchema.parse({ limit: "25", cursor: "cur_abc" });
      expect(parsed.limit).toBe(25);
      expect(parsed.cursor).toBe("cur_abc");

      const defaulted = PaginationQuerySchema.parse({});
      expect(defaulted.limit).toBe(50);
      expect(defaulted.cursor).toBeUndefined();
    });

    it("should reject negative or out-of-bound pagination limits", () => {
      expect(() => PaginationQuerySchema.parse({ limit: 0 })).toThrow();
      expect(() => PaginationQuerySchema.parse({ limit: 101 })).toThrow();
    });

    it("should create valid PaginatedResult generic schemas", () => {
      const CompanyPageSchema = createPaginatedResultSchema(CreateCompanySchema);
      const validPayload = {
        items: [
          {
            legalName: "Stripe, Inc.",
            displayName: "Stripe",
            domain: "stripe.com",
            verificationStatus: "VERIFIED" as const,
            industries: ["fintech"],
            subIndustries: [],
            operatingLocations: [],
            technologyCategories: [],
            hiringActivity: true,
            activeJobOpenings: 12,
          },
        ],
        nextCursor: "672f9a12bcf86cd799439011",
        hasMore: true,
        total: 100,
      };

      const result = CompanyPageSchema.parse(validPayload);
      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.domain).toBe("stripe.com");
      expect(result.hasMore).toBe(true);
    });
  });

  describe("DTO Schemas", () => {
    describe("CreateCompanySchema", () => {
      it("should accept valid company payloads and supply default values", () => {
        const payload = {
          legalName: "Anthropic PBC",
          displayName: "Anthropic",
          domain: "anthropic.com",
        };

        const result = CreateCompanySchema.parse(payload);
        expect(result.displayName).toBe("Anthropic");
        expect(result.verificationStatus).toBe("UNVERIFIED");
        expect(result.hiringActivity).toBe(false);
        expect(result.activeJobOpenings).toBe(0);
        expect(result.industries).toEqual([]);
      });

      it("should reject missing required fields", () => {
        expect(() => CreateCompanySchema.parse({ legalName: "Anthropic" })).toThrow();
        expect(() => CreateCompanySchema.parse({ displayName: "Anthropic" })).toThrow();
      });
    });

    describe("CreateRecruiterSchema", () => {
      it("should accept valid recruiter and default status to UNVERIFIED", () => {
        const payload = {
          name: "Jane Doe",
          email: "jane@company.com",
          designation: "Principal Technical Recruiter",
        };

        const result = CreateRecruiterSchema.parse(payload);
        expect(result.name).toBe("Jane Doe");
        expect(result.email).toBe("jane@company.com");
        expect(result.verificationStatus).toBe("UNVERIFIED");
      });

      it("should reject malformed email address", () => {
        expect(() =>
          CreateRecruiterSchema.parse({
            name: "Jane Doe",
            email: "not-an-email-address",
          })
        ).toThrow();
      });
    });

    describe("CreateJobPostingSchema", () => {
      it("should accept valid job posting and enforce URL formatting", () => {
        const payload = {
          title: "Staff Distributed Systems Engineer",
          type: "full_time" as const,
          workMode: "remote" as const,
          applicationUrl: "https://careers.stripe.com/jobs/123",
          salaryMin: 220000,
          salaryMax: 280000,
        };

        const result = CreateJobPostingSchema.parse(payload);
        expect(result.title).toBe("Staff Distributed Systems Engineer");
        expect(result.type).toBe("full_time");
        expect(result.workMode).toBe("remote");
        expect(result.isActive).toBe(true);
      });

      it("should reject negative salaries and invalid URLs", () => {
        expect(() =>
          CreateJobPostingSchema.parse({
            title: "Engineer",
            type: "full_time" as const,
            workMode: "remote" as const,
            applicationUrl: "not-a-valid-url",
          })
        ).toThrow();

        expect(() =>
          CreateJobPostingSchema.parse({
            title: "Engineer",
            type: "full_time" as const,
            workMode: "remote" as const,
            applicationUrl: "https://example.com/apply",
            salaryMin: -500,
          })
        ).toThrow();
      });
    });

    describe("CreateWorkspaceSchema & Auth", () => {
      it("should enforce lowercase alphanumeric hyphenated slug format", () => {
        expect(CreateWorkspaceSchema.parse({ name: "Acme Corp", slug: "acme-corp" })).toEqual({
          name: "Acme Corp",
          slug: "acme-corp",
        });

        expect(() =>
          CreateWorkspaceSchema.parse({ name: "Acme", slug: "Acme Corp!" })
        ).toThrow();
      });

      it("should validate Register and Login schemas", () => {
        expect(
          RegisterSchema.parse({ email: "user@example.com", password: "securePassword123" })
        ).toBeTruthy();

        expect(() =>
          RegisterSchema.parse({ email: "user@example.com", password: "short" })
        ).toThrow();

        expect(
          LoginSchema.parse({ email: "user@example.com", password: "anyPassword" })
        ).toBeTruthy();

        expect(() => LoginSchema.parse({ email: "invalid-email", password: "pass" })).toThrow();
      });
    });
  });

  describe("RFC 9457 / AppError Hierarchy", () => {
    it("should instantiate base AppError with appropriate status code and details", () => {
      const error = new AppError("CUSTOM_CODE", 418, "I'm a teapot", { foo: "bar" });
      expect(error.code).toBe("CUSTOM_CODE");
      expect(error.statusCode).toBe(418);
      expect(error.message).toBe("I'm a teapot");
      expect(error.details).toEqual({ foo: "bar" });
      expect(error.name).toBe("AppError");
    });

    it("should instantiate NotFoundError with 404 status and formatted message", () => {
      const error = new NotFoundError("Recruiter", "rec_123");
      expect(error.code).toBe("NOT_FOUND");
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe("Recruiter not found: rec_123");
    });

    it("should instantiate UnauthorizedError, ForbiddenError, and ConflictError", () => {
      const unauth = new UnauthorizedError("Session expired");
      expect(unauth.code).toBe("UNAUTHORIZED");
      expect(unauth.statusCode).toBe(401);

      const forbidden = new ForbiddenError("Insufficient rights");
      expect(forbidden.code).toBe("FORBIDDEN");
      expect(forbidden.statusCode).toBe(403);

      const conflict = new ConflictError("Domain already registered");
      expect(conflict.code).toBe("CONFLICT");
      expect(conflict.statusCode).toBe(409);
    });

    it("should instantiate ValidationError with details payload and 400 status", () => {
      const validation = new ValidationError("Invalid parameters", { field: "email" });
      expect(validation.code).toBe("VALIDATION_ERROR");
      expect(validation.statusCode).toBe(400);
      expect(validation.details).toEqual({ field: "email" });
    });
  });

  describe("RBAC Permissions Catalog", () => {
    it("should export defined permissions constants for security checks", () => {
      expect(PERMISSIONS.AUTH_LOGIN).toBe("auth:login");
      expect(PERMISSIONS.AUTH_MANAGE_USERS).toBe("auth:manage_users");
      expect(typeof PERMISSIONS.WORKSPACE_READ).toBe("string");
      expect(typeof PERMISSIONS.COMPANY_READ).toBe("string");
      expect(typeof PERMISSIONS.RECRUITER_READ).toBe("string");
      expect(typeof PERMISSIONS.JOB_READ).toBe("string");
    });
  });
});
