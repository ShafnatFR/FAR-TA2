-- Migration to update roles to accommodate 6 roles:
-- Donatur Individu, Donatur Korporat, Penerima, Relawan, Admin Pengelola, dan Super Admin

-- 1. Temporarily change to VARCHAR to prevent data loss during ENUM change
ALTER TABLE `users` MODIFY `role` VARCHAR(50) NOT NULL;
ALTER TABLE `badges` MODIFY `role` VARCHAR(50) DEFAULT NULL;

-- 2. Data Migration: Mapping existing values to new ones
UPDATE `users` SET `role` = 'INDIVIDUAL_DONOR' WHERE `role` = 'DONATUR';
UPDATE `users` SET `role` = 'RECEIVER' WHERE `role` = 'PENERIMA';
UPDATE `users` SET `role` = 'VOLUNTEER' WHERE `role` = 'RELAWAN';

UPDATE `badges` SET `role` = 'INDIVIDUAL_DONOR' WHERE `role` = 'DONATUR';
UPDATE `badges` SET `role` = 'RECEIVER' WHERE `role` = 'PENERIMA';
UPDATE `badges` SET `role` = 'VOLUNTEER' WHERE `role` = 'RELAWAN';

-- 3. Finalize to new ENUM with 6 roles
ALTER TABLE `users` MODIFY `role` ENUM(
    'INDIVIDUAL_DONOR',
    'CORPORATE_DONOR',
    'RECEIVER',
    'VOLUNTEER',
    'ADMIN',
    'SUPER_ADMIN'
) NOT NULL;

ALTER TABLE `badges` MODIFY `role` ENUM(
    'INDIVIDUAL_DONOR',
    'CORPORATE_DONOR',
    'RECEIVER',
    'VOLUNTEER',
    'ADMIN',
    'SUPER_ADMIN'
) DEFAULT NULL;
