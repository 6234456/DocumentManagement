# -*- coding: <utf-8> -*-

# author:    Qiou Yang
# email:     sgfxqw@gmail.com
# desc:      ORM-Model and the persistence through DB

from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, create_engine, DateTime, Date, Table
from sqlalchemy.orm import sessionmaker, relationship, backref
from datetime import datetime
from json import dumps, loads

#import win32com.client as win32
import os
from xlDataStructure import xlDict, xltoLeft



def dateToString(d):
    if d is None:
        return None

    return d.strftime("%Y-%m-%d")

def timeToString(d):
    if d is None:
        return None

    return d.strftime("%Y-%m-%d %H:%M:%S")

def stringToDate(d):
    if d == "" or d is None:
        return None

    return datetime.strptime(d, "%Y-%m-%d")

def stringToTime(d):
    if d == "" or d is None:
        return None

    return datetime.strptime(d, "%Y-%m-%d %H:%M:%S")

Base = declarative_base()
doc_tag = Table("doc_tag", Base.metadata, Column("doc_id", Integer, ForeignKey("doc.id")), Column("tag_id", Integer, ForeignKey("tag.id")))
doc_sub = Table("doc_sub", Base.metadata, Column("doc_id", Integer, ForeignKey("doc.id")), Column("sub_id", Integer, ForeignKey("subsidiary.id")))
doc_sign = Table("doc_sign", Base.metadata, Column("doc_id", Integer, ForeignKey("doc.id")), Column("sign_id", Integer, ForeignKey("user.id")))
doc_par = Table("doc_par", Base.metadata, Column("doc_id", Integer, ForeignKey("doc.id")), Column("par_id", Integer, ForeignKey("partner.id")))

class Document(Base):
    __tablename__ = 'doc'

    id = Column(Integer, primary_key=True)

    name = Column(String(100))
    desc = Column(String(200))

    signed_on = Column(Date)

    # many-to-many   users<->docs
    signed_by = relationship('User', secondary=doc_sign, backref="signedDocs")

     # many-to-many   tags<->docs
    tags = relationship('Tag', secondary=doc_tag, backref="docs")

     # many-to-many   subsidiaries<->docs
    subsidiaries = relationship('Subsidiary', secondary=doc_sub, backref="docs")

     # many-to-many   partners<->docs
    partners = relationship('Partner', secondary=doc_par, backref="docs")

    # one-to-many     category<->docs
    category_id = Column(Integer, ForeignKey("category.id"))
    category = relationship("Category", backref=backref("docs", order_by=id), foreign_keys=[category_id])

    # many-to-one    categories<->archive
    archive_id = Column(Integer, ForeignKey("archive.id"))
    archive = relationship("Archive", backref=backref('docs', order_by=id))

    pos = Column(String(50))
    path = Column(String(400))

    created_on = Column(DateTime)
    created_by = Column(Integer, ForeignKey("user.id"))

    active = Column(Boolean)
    deleted_by = Column(Integer, ForeignKey("user.id"))
    deleted_on = Column(DateTime)

    validate_till = Column(Date)
    validate_since = Column(Date)

    creator = relationship("User", backref=backref("created", order_by=id), foreign_keys=[created_by])

    deleter = relationship("User", backref=backref("deleted", order_by=id), foreign_keys=[deleted_by])

    def __init__(self, name, desc, signedOn, entryById, categoryId, archiveId, pos, validate_since=None, validate_till=None, path="", *s, **kw):
        self.name = name
        self.desc = desc
        self.signed_on = signedOn

        self.created_by = entryById

        # can be with more than one signatures
        self.category_id = categoryId

        self.archive_id = archiveId

        self.pos = pos

        self.validate_since = validate_since or datetime.today()
        self.validate_till = validate_till

        self.created_on = datetime.now()
        self.active = True


    def remove(self, deleter):
        self.deleter = deleter
        self.active = False
        self.deleted_on = datetime.now()

    def toDict(self):
        return {
                "id":self.id, "name":self.name, "desc": self.desc, "signed_on": dateToString(self.signed_on), "entryById": self.created_by, "path": self.path, "created_on": timeToString(self.created_on),
                "categoryId": self.category_id, "categoryName": self.category.name, "archive": {"id":self.archive_id, "name":self.archive.name}, "pos": self.pos, "validateSince" : dateToString(self.validate_since),
                "validateTill" : dateToString(self.validate_till), "active": self.active, "tags": [ {"name" : i.name, "id": i.id }for i in self.tags],
                "tagsName": [i.name for i in self.tags], "subsidiariesName" : [ i.name for i in self.subsidiaries],
                "partners": [ {"name" : i.name, "id": i.id } for i in self.partners], "signers" : [{"name" : i.name, "id": i.id } for i in self.signed_by],
                "subsidiaries" : [ {"name" : i.name, "id": i.id } for i in self.subsidiaries]
        }

    def toJSON(self):
        return dumps(self.toDict())

    @staticmethod
    def fromJSON(d):
        return Document.fromDict(loads(d))

    @staticmethod
    def fromDict(d):
        data = d
        data['signedOn'] = stringToDate(data['signed_on'])
        data['validate_since'] = stringToDate(data['validateSince'])
        data['validate_till'] = stringToDate(data['validateTill'])

        obj =  Document(**data)
        return obj


class Category(Base):
    __tablename__ = "category"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True)


    def __init__(self, id, name):
        self.id = id
        self.name = name

    def __repr__(self):
        return self.name.encode('utf-8')


class Subsidiary(Base):
    __tablename__ = "subsidiary"

    id = Column(Integer, primary_key=True)
    name = Column(String(100))
    country = Column(String(2))
    city = Column(String(50))
    zip = Column(String(20))
    street = Column(String(100))

    def __init__(self, name, country, city, zip, street):
        self.name = name
        self.country = country
        self.city = city
        self.zip = zip
        self.street = street

class Partner(Base):
    __tablename__ = "partner"

    id = Column(Integer, primary_key=True)
    name = Column(String(100))
    country = Column(String(2))
    city = Column(String(50))
    zip = Column(String(20))
    street = Column(String(100))

    def __init__(self, name, country, city, zip, street):
        self.name = name
        self.country = country
        self.city = city
        self.zip = zip
        self.street = street

class User(Base):
    __tablename__ = 'user'

    id = Column(Integer, primary_key=True)
    name = Column(String(20))
    fullname = Column(String(50))
    pwd = Column(String(20))

    def __init__(self, name, fullname, pwd):
        self.name = name
        self.fullname = fullname
        self.pwd = str(pwd)

    def __repr__(self):
        return self.fullname.encode('utf-8')


class Tag(Base):
    __tablename__ = "tag"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True)


    def __init__(self, name):
        self.name = name

    def __repr__(self):
        return self.name.encode('utf-8')

class Archive(Base):
    __tablename__ = "archive"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True)

    def __init__(self, name):
        self.name = name

    def __repr__(self):
        return self.name.encode('utf-8')



class DBUtil:
    def __init__(self, url=None):
        if url is None:
            url = "sqlite:///database.db"

        self.db = url
        self.engine = create_engine(url, echo=True)
        self.session = None

    def initialize(self):
        Base.metadata.create_all(self.engine)

        # init of status
        self.openSession()

        session = db.session

        # store the initial data in the spreadsheet tables.xlsx
        application = win32.gencache.EnsureDispatch('Excel.Application')
        wb = application.Workbooks.Open("{0}{1}{2}".format(os.getcwd(), os.path.sep, "tables.xlsx"), ReadOnly=True)

        for i in wb.Worksheets:
            tmpList = []
            clazz = globals()[i.Name]
            x = i.Cells(1, i.Columns.Count).End(xltoLeft).Column
            title = i.Range(i.Cells(1, 1), i.Cells(1, x)).Value[0]
            d = xlDict(i, 1, (1, x), 2)
            d = d.titledDict(title).raw

            for k, v in d.iteritems():
                tmpList.append(clazz(**v))

            session.add_all(tmpList)

        wb.Close(SaveChanges=False)

        session.commit()


    def openSession(self):
        if self.session is None:
            self.session = sessionmaker(bind=self.engine)()

    def remove(self, id, clazz):
        self.openSession()
        self.session.query(clazz).filter(clazz.id==id).delete()

    def update(self, id, clazz, obj):
        self.openSession()
        self.remove(id, clazz)
        self.add(obj)

    def byID(self, id, clazz):
        return self.session.query(clazz).filter(clazz.id==id).one()

    def add(self, obj):
        self.openSession()
        self.session.add(obj)

    def commit(self):
        self.session.commit()


if __name__ == '__main__':
    db = DBUtil()
    db.initialize()
    db.openSession()
    db.session.add( Archive("D67"))
    db.session.add(Document("Demo3", "For the Demo3", datetime.today(),1 , 3000, 1, "5B"))

    db.commit()
    # print dumps([i.toDict() for i in db.session.query(Document).filter(True).all()])
    #
    # print db.session.query(Document).filter(True).first().toJSON()
