DROP TABLE IF EXISTS users, users_preferences, notifications, devices, scenes, automations;

CREATE TABLE users (
    home_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE users_preferences (
    home_id INT REFERENCES users(home_id) ON DELETE CASCADE,
    preferred_temperature FLOAT NOT NULL,
    preferred_humidity FLOAT NOT NULL,
    preferred_lighting INT NOT NULL,
    PRIMARY KEY (home_id)
);

CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    home_id INT REFERENCES users(home_id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    notification_message VARCHAR(200) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE devices (
    device_id SERIAL PRIMARY KEY,
    home_id INT REFERENCES users(home_id) ON DELETE CASCADE,
    device_name VARCHAR(50) NOT NULL UNIQUE,
    device_type VARCHAR(50) NOT NULL,
    device_status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE scenes (
    scene_id SERIAL PRIMARY KEY,
    home_id INT REFERENCES users(home_id) ON DELETE CASCADE,
    scene_name VARCHAR(50) NOT NULL,
    scene_description VARCHAR(200) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE automations (
    automation_id SERIAL PRIMARY KEY,
    home_id INT REFERENCES users(home_id) ON DELETE CASCADE,
    automation_name VARCHAR(50) NOT NULL,
    automation_trigger VARCHAR(50) NOT NULL,
    automation_action VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

