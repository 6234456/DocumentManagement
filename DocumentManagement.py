from flask import Flask, request, render_template
from ORM import DBUtil, Document, Tag, Partner, Archive, Subsidiary, User, Category
from json import dumps

app = Flask(__name__, static_url_path='')
db = DBUtil()
db.openSession()

def processAttr(doc, arr):

    doc.subsidiaries = [db.byID(i.id, Subsidiary) for i in arr["subsidiaries"]]
    doc.partners = [db.byID(i.id, Partner) for i in arr["partners"]]
    doc.signed_by = [db.byID(i.id, User) for i in arr["signers"]]

    if not arr['archive']['id']:
        db.session.add(Archive(arr['archive']['name']))
        db.commit()

    doc.archive_id = db.session.query(Archive).filter(Archive.name == arr['archive']['name']).one().id

    tagArr = []
    for i in arr["tags"]:
        if "id" not in i:
            tagArr.append(Tag(i.name))
        else:
            tagArr.append(db.byID(i.id, Tag))

    doc.tags = tagArr

@app.route('/')
def hello():
    return render_template("main.html")

@app.route("/docs")
def docs():
    return dumps([i.toDict() for i in db.session.query(Document).filter(Document.active == True).all()])

@app.route("/subsidiaries")
def subsidiaries():
    return dumps([{"name":i.name, "id":i.id} for i in db.session.query(Subsidiary).filter(True).all()])

@app.route("/categories")
def categories():
    return dumps([{"name":i.name, "id":i.id} for i in db.session.query(Category).filter(True).all()])

@app.route("/tags")
def tags():
    return dumps([{"name":i.name, "id":i.id} for i in db.session.query(Tag).filter(True).all()])

@app.route("/add_doc", methods=['POST'])
def add_doc():
    json = request.get_json()
    d = Document.fromDict(json)
    processAttr(d, json)
    db.session.add(d)
    db.commit()
    return "OK"

@app.route("/delete_doc", methods=['POST'])
def delete_doc():
    targ = request.get_json()

    obj = db.session.query(Document).filter(Document.id==targ['id']).one()

    if obj:
        obj.remove(None)
        db.commit()
    else:
        return "Fail"

    return "OK"

@app.route("/add_tag", methods=['POST'])
def add_tag():
    for i in request.get_json()['tags']:
        db.session.add(Tag(i))

    db.commit()

    # tags = [Tag(i) for i in request.get_json()['tags']]
    # db.session.add(tags)
    return "OK"




@app.route("/change_doc", methods=['POST'])
def change_doc():
    db.openSession()
    doc = request.get_json()

    old_doc = db.byID(doc['id'], Document)

    db.session.delete(old_doc)
    d = Document.fromDict(doc)
    processAttr(d, doc)
    db.session.add(d)

    db.commit()
    return "OK"

if __name__ == '__main__':
    app.run(debug=True)
