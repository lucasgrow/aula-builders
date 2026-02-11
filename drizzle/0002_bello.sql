-- Bello (Kanban) tables

CREATE TABLE `board` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `description` text,
  `background` text DEFAULT '#059669',
  `ownerId` text NOT NULL,
  `isClosed` integer NOT NULL DEFAULT 0,
  `createdAt` integer NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (`ownerId`) REFERENCES `user`(`id`) ON DELETE CASCADE
);

CREATE TABLE `board_member` (
  `id` text PRIMARY KEY NOT NULL,
  `boardId` text NOT NULL,
  `userId` text NOT NULL,
  `role` text NOT NULL DEFAULT 'member',
  `createdAt` integer NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (`boardId`) REFERENCES `board`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
CREATE UNIQUE INDEX `board_member_uniq` ON `board_member` (`boardId`, `userId`);

CREATE TABLE `list` (
  `id` text PRIMARY KEY NOT NULL,
  `boardId` text NOT NULL,
  `title` text NOT NULL,
  `position` integer NOT NULL DEFAULT 0,
  `isArchived` integer NOT NULL DEFAULT 0,
  `createdAt` integer NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (`boardId`) REFERENCES `board`(`id`) ON DELETE CASCADE
);

CREATE TABLE `card` (
  `id` text PRIMARY KEY NOT NULL,
  `listId` text NOT NULL,
  `title` text NOT NULL,
  `description` text,
  `position` integer NOT NULL DEFAULT 0,
  `dueDate` integer,
  `coverColor` text,
  `isArchived` integer NOT NULL DEFAULT 0,
  `createdAt` integer NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (`listId`) REFERENCES `list`(`id`) ON DELETE CASCADE
);

CREATE TABLE `label` (
  `id` text PRIMARY KEY NOT NULL,
  `boardId` text NOT NULL,
  `name` text NOT NULL,
  `color` text NOT NULL,
  `createdAt` integer NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (`boardId`) REFERENCES `board`(`id`) ON DELETE CASCADE
);

CREATE TABLE `card_label` (
  `id` text PRIMARY KEY NOT NULL,
  `cardId` text NOT NULL,
  `labelId` text NOT NULL,
  `createdAt` integer NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (`cardId`) REFERENCES `card`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`labelId`) REFERENCES `label`(`id`) ON DELETE CASCADE
);
CREATE UNIQUE INDEX `card_label_uniq` ON `card_label` (`cardId`, `labelId`);

CREATE TABLE `card_member` (
  `id` text PRIMARY KEY NOT NULL,
  `cardId` text NOT NULL,
  `userId` text NOT NULL,
  `createdAt` integer NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (`cardId`) REFERENCES `card`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
CREATE UNIQUE INDEX `card_member_uniq` ON `card_member` (`cardId`, `userId`);

CREATE TABLE `comment` (
  `id` text PRIMARY KEY NOT NULL,
  `cardId` text NOT NULL,
  `userId` text NOT NULL,
  `content` text NOT NULL,
  `createdAt` integer NOT NULL DEFAULT (unixepoch()),
  `updatedAt` integer NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (`cardId`) REFERENCES `card`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE
);

CREATE TABLE `activity` (
  `id` text PRIMARY KEY NOT NULL,
  `boardId` text NOT NULL,
  `cardId` text,
  `userId` text NOT NULL,
  `type` text NOT NULL,
  `data` text,
  `createdAt` integer NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (`boardId`) REFERENCES `board`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE
);

CREATE TABLE `checklist` (
  `id` text PRIMARY KEY NOT NULL,
  `cardId` text NOT NULL,
  `title` text NOT NULL,
  `position` integer NOT NULL DEFAULT 0,
  `createdAt` integer NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (`cardId`) REFERENCES `card`(`id`) ON DELETE CASCADE
);

CREATE TABLE `checklist_item` (
  `id` text PRIMARY KEY NOT NULL,
  `checklistId` text NOT NULL,
  `title` text NOT NULL,
  `isChecked` integer NOT NULL DEFAULT 0,
  `position` integer NOT NULL DEFAULT 0,
  `createdAt` integer NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (`checklistId`) REFERENCES `checklist`(`id`) ON DELETE CASCADE
);

CREATE TABLE `attachment` (
  `id` text PRIMARY KEY NOT NULL,
  `cardId` text NOT NULL,
  `userId` text NOT NULL,
  `filename` text NOT NULL,
  `originalFilename` text NOT NULL,
  `contentType` text NOT NULL,
  `size` integer NOT NULL,
  `s3Key` text NOT NULL,
  `createdAt` integer NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (`cardId`) REFERENCES `card`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
