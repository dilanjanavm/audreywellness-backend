-- Create task_templates table
CREATE TABLE IF NOT EXISTS `task_templates` (
    `id` CHAR(36) PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `is_default` BOOLEAN DEFAULT FALSE,
    `assigned_phase_id` CHAR(36) NULL,
    `mandatory_fields` JSON NOT NULL,
    `optional_fields` JSON NULL,
    `optional_field_config` JSON NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `created_by` CHAR(36) NULL,
    CONSTRAINT `fk_template_phase` FOREIGN KEY (`assigned_phase_id`) REFERENCES `task_phases` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_template_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    INDEX `idx_template_phase` (`assigned_phase_id`),
    INDEX `idx_template_default` (`is_default`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create default template
INSERT INTO `task_templates` (
    `id`,
    `name`,
    `description`,
    `is_default`,
    `assigned_phase_id`,
    `mandatory_fields`,
    `optional_fields`,
    `optional_field_config`,
    `created_at`,
    `updated_at`
) VALUES (
    UUID(),
    'Default Task Template',
    'Default template for all phases',
    TRUE,
    NULL,
    JSON_OBJECT(
        'taskName', TRUE,
        'taskDescription', TRUE,
        'assignTo', TRUE,
        'priority', TRUE,
        'startDate', TRUE,
        'endDate', TRUE,
        'status', TRUE
    ),
    JSON_ARRAY(),
    JSON_OBJECT(),
    NOW(),
    NOW()
);

-- Create Filling & Packing template (if phase exists)
-- Note: Replace {FILLING_PACKING_PHASE_ID} with actual phase ID
INSERT INTO `task_templates` (
    `id`,
    `name`,
    `description`,
    `is_default`,
    `assigned_phase_id`,
    `mandatory_fields`,
    `optional_fields`,
    `optional_field_config`,
    `created_at`,
    `updated_at`
)
SELECT 
    UUID(),
    'Filling & Packing Template',
    'Template for filling and packing phase with customer details',
    FALSE,
    tp.id,
    JSON_OBJECT(
        'taskName', TRUE,
        'taskDescription', TRUE,
        'assignTo', TRUE,
        'priority', TRUE,
        'startDate', TRUE,
        'endDate', TRUE,
        'status', TRUE
    ),
    JSON_ARRAY('orderNumber', 'customerName', 'customerAddress', 'customerContact'),
    JSON_OBJECT(
        'orderNumber', JSON_OBJECT('inputType', 'text'),
        'customerName', JSON_OBJECT('inputType', 'text'),
        'customerAddress', JSON_OBJECT('inputType', 'text'),
        'customerContact', JSON_OBJECT('inputType', 'text')
    ),
    NOW(),
    NOW()
FROM `task_phases` tp
WHERE tp.name = 'Filling & Packing'
LIMIT 1;
