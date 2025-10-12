#!/bin/bash
[ ! -f .env ] || export $(grep -v '^#' .env | xargs)

[ -z "${RDB1_USER}" ] && exit 1
[ -z "${RDB1_PASS}" ] && exit 1
[ -z "${RDB1_DB_NAME}" ] && exit 1
[ -z "${RDB1_PRISMA_SHADOW_DB_NAME}" ] && exit 1

echo =====
echo This drops all database. Please use this carefully
echo =====

echo wiping database \(needs root password\)...
cat << EOD | mysql -u admin -p -h ${RDB1_HOST} -P ${RDB1_PORT}

-- user
CREATE USER IF NOT EXISTS ${RDB1_USER} IDENTIFIED BY '${RDB1_PASS}' ;

SELECT user,host FROM mysql.user;

-- main schema
DROP DATABASE IF EXISTS \`${RDB1_DB_NAME}\` ;
CREATE DATABASE \`${RDB1_DB_NAME}\` ;
GRANT ALL ON \`${RDB1_DB_NAME}\`.* TO '${RDB1_USER}'@'%' ;

-- prisma shadow
DROP DATABASE IF EXISTS \`${RDB1_PRISMA_SHADOW_DB_NAME}\` ;
CREATE DATABASE \`${RDB1_PRISMA_SHADOW_DB_NAME}\` ;
GRANT ALL ON \`${RDB1_PRISMA_SHADOW_DB_NAME}\`.* TO '${RDB1_USER}'@'%' ;

-- jest worker #1
DROP DATABASE IF EXISTS \`${RDB1_DB_NAME}--1\` ;
CREATE DATABASE \`${RDB1_DB_NAME}--1\` ;
GRANT ALL ON \`${RDB1_DB_NAME}--1\`.* TO '${RDB1_USER}'@'%' ;

-- jest worker #2
DROP DATABASE IF EXISTS \`${RDB1_DB_NAME}--2\` ;
CREATE DATABASE \`${RDB1_DB_NAME}--2\` ;
GRANT ALL ON \`${RDB1_DB_NAME}--2\`.* TO '${RDB1_USER}'@'%' ;

-- jest worker #3
DROP DATABASE IF EXISTS \`${RDB1_DB_NAME}--3\` ;
CREATE DATABASE \`${RDB1_DB_NAME}--3\` ;
GRANT ALL ON \`${RDB1_DB_NAME}--3\`.* TO '${RDB1_USER}'@'%' ;

-- jest worker #4
DROP DATABASE IF EXISTS \`${RDB1_DB_NAME}--4\` ;
CREATE DATABASE \`${RDB1_DB_NAME}--4\` ;
GRANT ALL ON \`${RDB1_DB_NAME}--4\`.* TO '${RDB1_USER}'@'%' ;

FLUSH PRIVILEGES;

SHOW DATABASES;

EOD


echo =======
echo migrating schema...
echo =======
npx prisma migrate reset --force --skip-generate

echo =======
echo migrating worker db \#1...
echo =======
RDB1_URL="${RDB1_URL}--1" npx prisma migrate reset --force --skip-generate

echo =======
echo migrating worker db \#2...
echo =======
RDB1_URL="${RDB1_URL}--2" npx prisma migrate reset --force --skip-generate

echo =======
echo migrating worker db \#3...
echo =======
RDB1_URL="${RDB1_URL}--3" npx prisma migrate reset --force --skip-generate

echo =======
echo migrating worker db \#4...
echo =======
RDB1_URL="${RDB1_URL}--4" npx prisma migrate reset --force --skip-generate

echo =======
echo generating database client
echo =======
npx prisma generate

echo =======
echo lining
echo =======
npx eslint 'src/**/*.ts'
[ $? -ne 0 ] && exit 1

echo =======
echo testing
echo =======
npx dotenv -v NODE_ENV=test -- jest
[ $? -ne 0 ] && exit 1

echo done
#__END__
