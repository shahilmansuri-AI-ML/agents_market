FROM postgres:15

# Copy init file
COPY db/init.sql /docker-entrypoint-initdb.d/init.sql

# Copy schema folder
COPY db/schema /db/schema
