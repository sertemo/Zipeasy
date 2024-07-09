# Copyright 2024 Sergio Tejedor Moreno

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import os
import threading
import time
from zipfile import ZipFile

from flask import (
    Flask,
    request,
    render_template,
    current_app,
    jsonify,
    send_from_directory,
)

from . import settings as st
from .logging_config import logger

app = Flask(__name__)


def delayed_file_removal(filepath, delay):
    """Elimina el archivo después de un retraso especificado en segundos."""
    time.sleep(delay)
    try:
        os.remove(filepath)
        logger.info(f"Archivo {filepath} eliminado exitosamente.")
    except Exception as e:
        logger.error(f"Error al eliminar el archivo {filepath}: {e}")


@app.route("/", methods=["POST", "GET"])
def index():
    if request.method == "POST":
        if "files" not in request.files:
            logger.info("El usuario no ha cargado archivos")
            return "No has cargado archivos", 400

        files = request.files.getlist("files")
        if not files:
            logger.info("El usuario no ha cargado archivos")
            return "No has cargado archivos", 400

        compress_filename = st.COMPRESS_FILENAME or "zipeasy"
        zip_filename: str = "_".join(
            [str(compress_filename), str(len(files)), "archivos_comprimidos.zip"]
        )
        zip_filepath = os.path.join(str(current_app.root_path), zip_filename)

        logger.info(f"Comprimiendo {len(files)} archivos:")

        # Comprimiendo los archivos
        with ZipFile(zip_filepath, "w") as zipf:
            for idx, file in enumerate(files, start=1):
                logger.info(f"{idx}- Comprimiendo archivo '{file.filename}'")
                file_path = os.path.join(current_app.root_path, str(file.filename))
                file.save(file_path)
                zipf.write(file_path, file.filename)
                os.remove(file_path)

        return jsonify({"zip_filename": zip_filename})

    return render_template("index.html")


@app.route("/download/<filename>", methods=["GET"])
def download_file(filename):
    directory = current_app.root_path
    filepath = os.path.join(directory, filename)
    logger.info(f"Descargando archivo {filepath}")

    response = send_from_directory(directory, filename, as_attachment=True)

    # Programa la eliminación del archivo en un hilo separado después de un retraso
    threading.Thread(
        target=delayed_file_removal, args=(filepath, st.ERASE_DELAY)
    ).start()

    return response


if __name__ == "__main__":
    app.run(debug=True, port=4321)
