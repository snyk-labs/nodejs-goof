from flask import Flask, request, render_template, send_from_directory, make_response, send_file
import os

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'

@app.route('/')
def index():
    images = os.listdir(app.config['UPLOAD_FOLDER'])
    return render_template('index.html', images=images)

@app.route('/uploads/<path:path>', methods=['GET'])
def uploads(path):
    return send_from_directory(app.config['UPLOAD_FOLDER'], path)

@app.route('/upload', methods=['POST'])
def upload():
    file = request.files['file']
    file.save(os.path.join(app.config['UPLOAD_FOLDER'], file.filename))
    command = "/usr/bin/convert "+ os.path.join(app.config['UPLOAD_FOLDER'], file.filename) +" -resize 100x100 "+ os.path.join(app.config['UPLOAD_FOLDER'], "resized-image-"+file.filename)
    os.system(command)
    response = make_response(
        send_file(os.path.join(app.config['UPLOAD_FOLDER'], "resized-image-" + file.filename), mimetype='image/png'))
    response.headers['Content-Disposition'] = 'attachment; filename=resized-image-' + file.filename
    return response

if __name__ == '__main__':
    app.run(debug=True,host='0.0.0.0')
