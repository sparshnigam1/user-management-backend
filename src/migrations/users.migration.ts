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

// CREATE TABLE modules (
// 	id UUID PRIMARY KEY DEFAULT uuidv7(),
// 	name VARCHAR(255) NOT NULL,
// 	route VARCHAR(255),
// 	query_str_type VARCHAR(255),
// 	query_str_value VARCHAR(255),
// 	type INTEGER NOT NULL CHECK (type IN (1, 2, 3)) DEFAULT 1,
// 	parent_id UUID REFERENCES modules(id),
// 	icon VARCHAR(255),
// 	priority INTEGER,
// 	status INTEGER DEFAULT 1,
// 	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
// 	updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
// )
