module.exports = {
    _PRIVATE_KEY: process.env.jwtPrivateKey ? process.env.jwtPrivateKey : 'userApp',
    _HOST: process.env._host ? process.env._host : 'localhost',
    _PORT: process.env._port ? process.env._host : 3000,
    _USERNAME: process.env._username ? process.env._username : 'root',
    _PSWD: process.env._password ? process.env._password : '1234',
    _DB_NAME: 'userDemoApp',
    _TABLES: [
        `CREATE TABLE IF NOT EXISTS roles (id int NOT NULL AUTO_INCREMENT, roleId int NOT NULL, description varchar(255) NOT NULL, PRIMARY KEY (id));`,
        `CREATE TABLE IF NOT EXISTS users (id int NOT NULL AUTO_INCREMENT, name varchar(255) NOT NULL, password varchar(255) NOT NULL, city varchar(255) NOT NULL, PRIMARY KEY (id));`,
        `CREATE TABLE IF NOT EXISTS logout_user_tokens (token varchar(255) NOT NULL);`,
        `CREATE TABLE IF NOT EXISTS user_role_mapping (userid int NOT NULL, roleid int NOT NULL, FOREIGN KEY (userid) REFERENCES users (id), FOREIGN KEY (roleid) REFERENCES roles (id))`
    ],
    _DEFAULT_ENTRIES: {
        roles: [
            `101, 'This is admin role and this user have access to all routes and data.'`,
            `102, 'This is child user and have limited access.'`
        ]
    },
    _ALLOWED_ROLES: {
        'admin': 101,
        'child': 102
    }
}