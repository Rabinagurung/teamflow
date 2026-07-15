export const BETTER_AUTH_ORGANIZATION_ERRORS = {
  ORGANIZATION_NOT_FOUND: "Organization not found",
  ORGANIZATION_ALREADY_EXISTS: "Organization already exists",
  ORGANIZATION_SLUG_ALREADY_TAKEN: "Organization slug already taken",
  SLUG_TAKEN_LEGACY: "slug is taken",
  CREATE_FORBIDDEN: "You are not allowed to create a new organization",
  ORGANIZATION_LIMIT_REACHED:
    "You have reached the maximum number of organizations",
  UPDATE_FORBIDDEN: "You are not allowed to update this organization",
  USER_NOT_MEMBER: "User is not a member of the organization",
  USER_ALREADY_MEMBER: "User is already a member of this organization",
  USER_ALREADY_INVITED: "User is already invited to this organization",
  INVITE_FORBIDDEN: "You are not allowed to invite users to this organization",
  INVITATION_LIMIT_REACHED: "Invitation limit reached",
  ROLE_NOT_FOUND_PREFIX: "Role not found",
} as const
