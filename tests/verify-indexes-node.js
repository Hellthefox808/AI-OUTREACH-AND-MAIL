/**
 * Node.js Empirical Verification Harness for Mongoose Schema Indexes.
 * Runs directly on the compiled JavaScript models in packages/database/dist.
 */

const path = require("path");
const Module = require("module");

// Redirect @career-intelligence/shared to compiled dist/index.js
const originalRequire = Module.prototype.require;
Module.prototype.require = function (modulePath) {
  if (modulePath === "@career-intelligence/shared") {
    return originalRequire.call(this, path.resolve(__dirname, "../packages/shared/dist/index.js"));
  }
  return originalRequire.apply(this, arguments);
};

// Load reflect-metadata from apps/be/node_modules
require(path.resolve(__dirname, "../apps/be/node_modules/reflect-metadata"));

const { CompanySchema } = require("../packages/database/dist/models/company.model");
const { RecruiterSchema } = require("../packages/database/dist/models/recruiter.model");
const { JobPostingSchema } = require("../packages/database/dist/models/job-posting.model");
const { SessionSchema } = require("../packages/database/dist/models/session.model");
const { UserSchema } = require("../packages/database/dist/models/user.model");
const { PermissionSchema } = require("../packages/database/dist/models/permission.model");
const { WorkspaceSchema } = require("../packages/database/dist/models/workspace.model");

let failures = 0;
function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    failures++;
  } else {
    console.log(`✓ PASS: ${message}`);
  }
}

console.log("=== EMPIRICAL VERIFICATION: TASK 1 SCHEMA INDEXES ===");

// 1. Company
const companyIndexes = CompanySchema.indexes();
const companyGlobalDomainUnique = companyIndexes.some(([fields, options]) => {
  return fields.domain === 1 && Object.keys(fields).length === 1 && options?.unique === true;
});
assert(!companyGlobalDomainUnique, "Company does NOT have a global unique index on domain");

const domainPath = CompanySchema.path("domain");
assert(!domainPath?.options?.unique, "Company domain path does not declare unique: true");

const companyCompoundDomain = companyIndexes.find(([fields]) => {
  return fields.workspaceId === 1 && fields.domain === 1 && Object.keys(fields).length === 2;
});
assert(companyCompoundDomain && companyCompoundDomain[1]?.unique === true, "Company has compound unique index { workspaceId: 1, domain: 1 }");

const companySortIndex = companyIndexes.find(([fields]) => {
  return fields.workspaceId === 1 && fields.createdAt === -1 && Object.keys(fields).length === 2;
});
assert(!!companySortIndex, "Company has sort index { workspaceId: 1, createdAt: -1 }");

// 2. Recruiter
const recruiterIndexes = RecruiterSchema.indexes();
const recruiterGlobalEmailUnique = recruiterIndexes.some(([fields, options]) => {
  return fields.email === 1 && Object.keys(fields).length === 1 && options?.unique === true;
});
assert(!recruiterGlobalEmailUnique, "Recruiter does NOT have a global unique index on email");

const recruiterCompoundEmail = recruiterIndexes.find(([fields]) => {
  return fields.workspaceId === 1 && fields.email === 1 && Object.keys(fields).length === 2;
});
assert(
  recruiterCompoundEmail &&
  recruiterCompoundEmail[1]?.unique === true &&
  JSON.stringify(recruiterCompoundEmail[1]?.partialFilterExpression) === JSON.stringify({ email: { $type: "string" } }),
  "Recruiter has unique partial index { workspaceId: 1, email: 1 } with { email: { $type: 'string' } }"
);

const recruiterSortIndex = recruiterIndexes.find(([fields]) => {
  return fields.workspaceId === 1 && fields.createdAt === -1 && Object.keys(fields).length === 2;
});
assert(!!recruiterSortIndex, "Recruiter has sort index { workspaceId: 1, createdAt: -1 }");

// 3. JobPosting
const jobIndexes = JobPostingSchema.indexes();
const jobGlobalUrlUnique = jobIndexes.some(([fields, options]) => {
  return fields.applicationUrl === 1 && Object.keys(fields).length === 1 && options?.unique === true;
});
assert(!jobGlobalUrlUnique, "JobPosting does NOT have global unique index on applicationUrl");

const jobCompoundUrl = jobIndexes.find(([fields]) => {
  return fields.workspaceId === 1 && fields.applicationUrl === 1 && Object.keys(fields).length === 2;
});
assert(
  jobCompoundUrl &&
  jobCompoundUrl[1]?.unique === true &&
  JSON.stringify(jobCompoundUrl[1]?.partialFilterExpression) === JSON.stringify({ applicationUrl: { $type: "string" } }),
  "JobPosting has unique partial index { workspaceId: 1, applicationUrl: 1 } with { applicationUrl: { $type: 'string' } }"
);

const jobSortIndex = jobIndexes.find(([fields]) => {
  return fields.workspaceId === 1 && fields.createdAt === -1 && Object.keys(fields).length === 2;
});
assert(!!jobSortIndex, "JobPosting has sort index { workspaceId: 1, createdAt: -1 }");

// 4. Session
const sessionIndexes = SessionSchema.indexes();
const sessionRefreshIndex = sessionIndexes.find(([fields]) => {
  return fields.refreshTokenHash === 1 && Object.keys(fields).length === 1;
});
assert(
  sessionRefreshIndex &&
  JSON.stringify(sessionRefreshIndex[1]?.partialFilterExpression) === JSON.stringify({ refreshTokenHash: { $type: "string" } }),
  "Session has partial index { refreshTokenHash: 1 } with { refreshTokenHash: { $type: 'string' } }"
);

// 5. User
const userIndexes = UserSchema.indexes();
const userWorkspaceIdsIndex = userIndexes.find(([fields]) => {
  return fields.workspaceIds === 1 && Object.keys(fields).length === 1;
});
assert(!!userWorkspaceIdsIndex, "User has multikey index { workspaceIds: 1 }");

const userResetTokenIndex = userIndexes.find(([fields]) => {
  return fields.passwordResetToken === 1 && Object.keys(fields).length === 1;
});
assert(
  userResetTokenIndex &&
  JSON.stringify(userResetTokenIndex[1]?.partialFilterExpression) === JSON.stringify({ passwordResetToken: { $type: "string" } }),
  "User has partial index { passwordResetToken: 1 } with { passwordResetToken: { $type: 'string' } }"
);

// 6. Permission
const permIndexes = PermissionSchema.indexes();
const permGlobalKeyUnique = permIndexes.some(([fields, options]) => {
  return fields.key === 1 && Object.keys(fields).length === 1 && options?.unique === true;
});
assert(!permGlobalKeyUnique, "Permission does NOT have a global unique index on key");

const keyPath = PermissionSchema.path("key");
assert(!keyPath?.options?.unique, "Permission key path does not declare unique: true");

const permCompoundKey = permIndexes.find(([fields]) => {
  return fields.workspaceId === 1 && fields.key === 1 && Object.keys(fields).length === 2;
});
assert(permCompoundKey && permCompoundKey[1]?.unique === true, "Permission has compound unique index { workspaceId: 1, key: 1 }");

// 7. Workspace
const wsIndexes = WorkspaceSchema.indexes();
const wsSlugIndex = wsIndexes.find(([fields]) => fields.slug === 1 && Object.keys(fields).length === 1);
assert(wsSlugIndex && wsSlugIndex[1]?.unique === true, "Workspace has unique index { slug: 1 }");

const wsOwnerIndex = wsIndexes.find(([fields]) => fields.ownerId === 1 && Object.keys(fields).length === 1);
assert(!!wsOwnerIndex, "Workspace has index { ownerId: 1 }");

console.log(`\nTask 1 Total Failures: ${failures}`);

console.log("\n=== EMPIRICAL VERIFICATION: TASK 2 BOUNDED PAGINATION STRESS TEST ===");

const { BaseRepository } = require("../packages/database/dist/repositories/base.repository");

class NodeTestPaginationRepo extends BaseRepository {
  constructor(model) {
    super(model);
  }
  testPaginate(filter, pagination, sortField, sortOrder) {
    return super.paginate(filter, pagination, sortField, sortOrder);
  }
}

async function testPaginationLimit(inputLimit) {
  let capturedLimit = 0;
  const mockQuery = {
    sort: () => mockQuery,
    limit: (n) => {
      capturedLimit = n;
      return mockQuery;
    },
    exec: async () => [],
  };
  const mockModel = {
    find: () => mockQuery,
  };
  const repo = new NodeTestPaginationRepo(mockModel);
  await repo.testPaginate({}, { limit: inputLimit });
  return capturedLimit;
}

(async () => {
  // Test limit = undefined -> must cap at 20 (+1 = 21)
  const limitUndef = await testPaginationLimit(undefined);
  assert(limitUndef === 21, `paginate with limit = undefined -> caps at 20 (+1 = 21, actual: ${limitUndef})`);

  // Test limit = 0 -> must clamp to 1 (+1 = 2)
  const limitZero = await testPaginationLimit(0);
  assert(limitZero === 2, `paginate with limit = 0 -> must clamp to 1 (+1 = 2, actual: ${limitZero})`);

  // Test limit = -50 -> must clamp to 1 (+1 = 2)
  const limitNeg = await testPaginationLimit(-50);
  assert(limitNeg === 2, `paginate with limit = -50 -> must clamp to 1 (+1 = 2, actual: ${limitNeg})`);

  // Test limit = 500 -> must clamp to 100 (+1 = 101)
  const limit500 = await testPaginationLimit(500);
  assert(limit500 === 101, `paginate with limit = 500 -> must clamp to 100 (+1 = 101, actual: ${limit500})`);

  console.log("\n=== EMPIRICAL VERIFICATION: TASK 3 withTransaction ERROR HANDLING & CLEANUP ===");

  // Test withTransaction when callback throws
  const mockSession1 = {
    withTransaction: async (cb) => {
      return cb();
    },
    endSession: function () {
      this.ended = true;
      this.endCalls = (this.endCalls || 0) + 1;
    },
  };
  const mockModel1 = {
    db: {
      startSession: async () => mockSession1,
    },
  };
  const repo1 = new NodeTestPaginationRepo(mockModel1);

  let caughtError1 = null;
  try {
    await repo1.withTransaction(async () => {
      throw new Error("Simulated write conflict inside transaction callback");
    });
  } catch (err) {
    caughtError1 = err;
  }
  assert(caughtError1 !== null, "withTransaction re-throws the callback error");
  assert(mockSession1.ended === true && mockSession1.endCalls === 1, "session.endSession is guaranteed to be called when callback throws");

  // Test withTransaction when withTransaction itself rejects (e.g., driver abort)
  const mockSession2 = {
    withTransaction: async () => {
      throw new Error("MongoServerError: WriteConflict");
    },
    endSession: function () {
      this.ended = true;
      this.endCalls = (this.endCalls || 0) + 1;
    },
  };
  const mockModel2 = {
    db: {
      startSession: async () => mockSession2,
    },
  };
  const repo2 = new NodeTestPaginationRepo(mockModel2);

  let caughtError2 = null;
  try {
    await repo2.withTransaction(async () => "ok");
  } catch (err) {
    caughtError2 = err;
  }
  assert(caughtError2 !== null, "withTransaction re-throws driver rejection");
  assert(mockSession2.ended === true && mockSession2.endCalls === 1, "session.endSession is guaranteed to be called when withTransaction rejects");

  console.log(`\n========================================`);
  console.log(`Total Empirical Failures Detected: ${failures}`);
  console.log(`========================================`);

  if (failures > 0) {
    console.error(`\n❌ VERDICT: REQUEST_CHANGES (Found ${failures} empirical failure(s))`);
    process.exit(1);
  } else {
    console.log(`\n✅ VERDICT: APPROVE (All empirical verification checks passed)`);
    process.exit(0);
  }
})();
