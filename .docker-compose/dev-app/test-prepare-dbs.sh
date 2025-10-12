#!/bin/sh
[ ! -f .env ] || export $(grep -v '^#' .env | xargs)

echo =======
echo re-creating test databases...
echo =======
cat << EOD | mysql -uroot -p${RDB1_ROOT_PASS} -h ${RDB1_HOST} -P ${RDB1_PORT}

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

EOD
echo done
echo

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

echo done
