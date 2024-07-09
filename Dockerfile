# Definir la imagen base
FROM python:3.10-slim

# Configurar el entorno de trabajo
WORKDIR /app

ENV POETRY_VERSION=1.8.3

# Instalar Poetry utilizando pip sin cache
RUN pip install --no-cache-dir "poetry==$POETRY_VERSION"

# Asegurarse de que el binario de Poetry esté en el PATH
ENV PATH="/root/.poetry/bin:${PATH}"

# Configurar Poetry: no crear un entorno virtual y no preguntar en la instalación
RUN poetry config virtualenvs.create false && \
    poetry config installer.parallel false

# Copiar solo archivos necesarios para la instalación de dependencias
COPY pyproject.toml poetry.lock* /app/

# Instalar dependencias de proyecto utilizando Poetry
RUN poetry install --no-dev --no-interaction --no-ansi

# Instalar gunicorn soportado por Flask
RUN poetry add gunicorn

# Eliminar cualquier entorno virtual existente
RUN rm -rf /app/.venv

# Crear el directorio de logs sino no puede escribir en archivo
RUN mkdir -p /app/logs

# Copiar el resto del código fuente al contenedor
COPY . /app

# Exponer el puerto en el que gunicorn estará escuchando
EXPOSE 4321

# Comando para ejecutar el servidor en modo producción
CMD ["gunicorn", "--bind", "0.0.0.0:4321", "src.zipeasy.main:app", "--workers", "4", "--timeout", "120"]

