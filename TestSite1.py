# -*- coding: utf-8 -*-
from flask import Flask, render_template, request, jsonify
import sqlite3

app = Flask(__name__, static_folder='static')

def db_create():
    db = sqlite3.connect('database.db')
    c = db.cursor()
    c.execute('''
    CREATE TABLE IF NOT EXISTS users (
        times TEXT NOT NULL,
        apples TEXT NOT NULL
    )
    ''')
    db.commit()
    db.close()


db_create()

@app.route('/game-1', methods=['GET', 'POST'])
def index():
    return render_template('index.html')


@app.route('/', methods=['GET', 'POST'])
def lobby():
    return render_template('lobby.html')


@app.route('/admin', methods=['GET', 'POST'])
def admin():
    db = sqlite3.connect('database.db')
    c = db.cursor()
    c.execute("SELECT times, apples FROM users")
    rows = c.fetchall()
    times = [row[0] for row in rows]  # Первый столбец - times
    apples = [row[1] for row in rows]  # Второй столбец - apples
    data = list(zip(times, apples))
    db.close()
    return render_template('admin.html', data=data)


@app.route('/sendData', methods=['POST'])
def sendData():
    data = request.get_json()
    time = data['time']
    apples = data['apples']
    db = sqlite3.connect('database.db')
    c = db.cursor()
    c.execute("INSERT INTO users (times, apples) VALUES (?, ?)",
              (time, apples))
    db.commit()
    db.close()
    return jsonify(success=True)


if __name__ == '__main__':
    app.run(debug=True)
