.PHONY: build up down down-v logs ps help urls clean db-shell redis-shell backup-db restore-db health

# ===========================================
# Core Container Management
# ===========================================

# Build and start all services
build:
	docker compose -f local.yml up --build -d --remove-orphans

# Start all services
up:
	docker compose -f local.yml up -d

# Stop all services
down:
	docker compose -f local.yml down

# Stop all services and remove volumes
down-v:
	docker compose -f local.yml down -v

# Show running containers
ps:
	docker compose -f local.yml ps

# ===========================================
# Logging
# ===========================================

# Show logs for all services
logs:
	docker compose -f local.yml logs -f

# ===========================================
# Database Operations
# ===========================================

# Access PostgreSQL shell
db-shell:
	docker compose -f local.yml exec postgres psql -U postgres -d app_db

# Access Redis shell
redis-shell:
	docker compose -f local.yml exec redis redis-cli

# Backup database
backup-db:
	docker compose -f local.yml exec -T postgres pg_dump -U postgres app_db > backup.sql

# Restore database
restore-db:
	docker compose -f local.yml exec -T postgres psql -U postgres app_db < backup.sql

# ===========================================
# Monitoring & Health
# ===========================================

# Check health of all services
health:
	@echo "Checking services health..."
	@docker compose -f local.yml ps
	@echo "\nPostgreSQL:"
	@docker compose -f local.yml exec postgres pg_isready -U postgres || echo "PostgreSQL is not ready"
	@echo "\nRedis:"
	@docker compose -f local.yml exec redis redis-cli ping || echo "Redis is not ready"
	@echo "\nRabbitMQ:"
	@docker compose -f local.yml exec rabbitmq rabbitmqctl ping || echo "RabbitMQ is not ready"

# ===========================================
# Cleanup
# ===========================================

# Clean all containers and volumes
clean:
	docker compose -f local.yml down -v
	docker system prune -f

# ===========================================
# Information
# ===========================================

# Show service URLs and access information
urls:
	@echo "PostgreSQL: localhost:5432 (User: postgres, Password: postgres)"
	@echo "pgAdmin: http://localhost:5050 (Email: admin@admin.com, Password: admin)"
	@echo "MailHog UI: http://localhost:8025"
	@echo "Redis: localhost:6379"
	@echo "RabbitMQ UI: http://localhost:15672 (User: admin, Password: admin)"

# Show available commands
help:
	@echo "Available commands:"
	@echo "  make build      - Build and start all services"
	@echo "  make up         - Start all services"
	@echo "  make down       - Stop all services"
	@echo "  make down-v     - Stop all services and remove volumes"
	@echo "  make logs       - Show logs for all services"
	@echo "  make ps         - Show running containers"
	@echo "  make db-shell   - Open PostgreSQL shell"
	@echo "  make redis-shell - Open Redis shell"
	@echo "  make backup-db  - Backup PostgreSQL database"
	@echo "  make restore-db - Restore PostgreSQL database"
	@echo "  make health     - Check services health"
	@echo "  make clean      - Clean all containers and volumes"
	@echo "  make urls       - Show service URLs" 