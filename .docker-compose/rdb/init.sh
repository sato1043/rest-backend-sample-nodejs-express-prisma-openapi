#!/bin/bash

echo creating prisma shadow database...
cat << EOD | mysql -uroot -p${RDB1_ROOT_PASS}

-- prisma shadow
CREATE DATABASE IF NOT EXISTS \`${RDB1_PRISMA_SHADOW_DB_NAME}\` ;
GRANT ALL ON \`${RDB1_PRISMA_SHADOW_DB_NAME}\`.* TO '${RDB1_USER}'@'%' ;

-- jest worker #1
CREATE DATABASE IF NOT EXISTS \`${MYSQL_DATABASE}--1\` ;
GRANT ALL ON \`${MYSQL_DATABASE}--1\`.* TO '${RDB1_USER}'@'%' ;

-- jest worker #2
CREATE DATABASE IF NOT EXISTS \`${MYSQL_DATABASE}--2\` ;
GRANT ALL ON \`${MYSQL_DATABASE}--2\`.* TO '${RDB1_USER}'@'%' ;

-- jest worker #3
CREATE DATABASE IF NOT EXISTS \`${MYSQL_DATABASE}--3\` ;
GRANT ALL ON \`${MYSQL_DATABASE}--3\`.* TO '${RDB1_USER}'@'%' ;

-- jest worker #4
CREATE DATABASE IF NOT EXISTS \`${MYSQL_DATABASE}--4\` ;
GRANT ALL ON \`${MYSQL_DATABASE}--4\`.* TO '${RDB1_USER}'@'%' ;

FLUSH PRIVILEGES;

EOD
