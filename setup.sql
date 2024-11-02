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
    device_name VARCHAR(50) NOT NULL,
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

INSERT INTO users (username, email, password)
VALUES 
    ('user1', 'user1@example.com', 'password123'),
    ('user2', 'user123@example.com', 'pass'),
    ('karl', 'karl@example.com', 'karLLLL');

INSERT INTO users_preferences (home_id, preferred_temperature, preferred_humidity, preferred_lighting)
VALUES (1, 22.0, 50.0, 50);

INSERT INTO notifications (home_id, notification_type, notification_message)
VALUES (1, 'Temperature Alert', 'The temperature is too high!');

INSERT INTO devices (home_id, device_name, device_type, device_status)
VALUES (1, 'Living Room Light', 'Light', 'On');

INSERT INTO scenes (home_id, scene_name, scene_description)
VALUES (1, 'Good Morning', 'Wake up to a bright and cozy morning');

INSERT INTO automations (home_id, automation_name, automation_trigger, automation_action)
VALUES (1, 'Good Morning', 'Sunrise', 'Turn on Living Room Light');

SELECT * FROM users;
SELECT * FROM users_preferences WHERE home_id = 1;
SELECT * FROM notifications WHERE home_id = 1;
