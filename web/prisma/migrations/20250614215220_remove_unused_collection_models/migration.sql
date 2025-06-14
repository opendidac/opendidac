/*
  Warnings:

  - You are about to drop the `Collection` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CollectionToQuestion` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Collection" DROP CONSTRAINT "Collection_groupId_fkey";

-- DropForeignKey
ALTER TABLE "CollectionToQuestion" DROP CONSTRAINT "CollectionToQuestion_collectionId_fkey";

-- DropForeignKey
ALTER TABLE "CollectionToQuestion" DROP CONSTRAINT "CollectionToQuestion_questionId_fkey";

-- DropTable
DROP TABLE "Collection";

-- DropTable
DROP TABLE "CollectionToQuestion";
