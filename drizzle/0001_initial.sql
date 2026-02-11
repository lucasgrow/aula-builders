CREATE TABLE `user` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text,
  `email` text NOT NULL,
  `emailVerified` integer,
  `image` text,
  `role` text NOT NULL DEFAULT 'user',
  `createdAt` integer NOT NULL
);

CREATE TABLE `account` (
  `userId` text NOT NULL,
  `type` text NOT NULL,
  `provider` text NOT NULL,
  `providerAccountId` text NOT NULL,
  `refresh_token` text,
  `access_token` text,
  `expires_at` integer,
  `token_type` text,
  `scope` text,
  `id_token` text,
  `session_state` text,
  PRIMARY KEY(`provider`, `providerAccountId`),
  FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE
);

CREATE TABLE `session` (
  `sessionToken` text PRIMARY KEY NOT NULL,
  `userId` text NOT NULL,
  `expires` integer NOT NULL,
  FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE
);

CREATE TABLE `verificationToken` (
  `identifier` text NOT NULL,
  `token` text NOT NULL,
  `expires` integer NOT NULL,
  PRIMARY KEY(`identifier`, `token`)
);

CREATE TABLE `user_settings` (
  `id` text PRIMARY KEY NOT NULL,
  `userId` text NOT NULL,
  `theme` text DEFAULT 'system',
  `createdAt` integer NOT NULL,
  `updatedAt` integer NOT NULL,
  FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
