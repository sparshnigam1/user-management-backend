export {};
// CREATE TABLE users (
//     id             UUID PRIMARY KEY DEFAULT uuidv7(),
//     role_id        UUID NOT NULL REFERENCES roles(id),
// 	first_name     TEXT NOT NULL,
// 	last_name      TEXT,
//     email_id       VARCHAR(255) UNIQUE NOT NULL,
//     phone_number   VARCHAR(20),
//     password       TEXT NOT NULL,
//     gender         VARCHAR(20),
//     created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
//     updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
//     is_locked      BOOLEAN NOT NULL DEFAULT false
// );
//# sourceMappingURL=users.migration.js.map