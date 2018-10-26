import Api from "./Api"
import Collection from "./Collection"
import ModelName from "./ModelName"
import Money from "js-money"

export default class BaseModel {
  static modelClassData() {
    throw "modelClassData should be overriden by child"
  }

  static find(id) {
    return new Promise((resolve, reject) => {
      var urlToUse = `${this.modelClassData().path}/${id}`

      Api.get(urlToUse).then((response) => {
        var modelClass = require(`ApiMaker/Models/${this.modelClassData().name}`).default
        var model = new modelClass(response.model)
        resolve(model)
      }, (error) => {
        reject(error)
      })
    })
  }

  static modelName() {
    return new ModelName({modelClassData: this.modelClassData()})
  }

  static ransack(query = {}) {
    return new Collection({"modelName": this.modelClassData().name, "ransack": query, "targetPathName": this.modelClassData().path})
  }

  constructor(modelData = {}) {
    this.changes = {}
    this.relationshipsCache = {}
    this.modelData = modelData
    this._preloadRelationships()
  }

  connect(eventName, callback) {
    var modelClassData = this.modelClassData()
    var modelName = modelClassData.name
    var callbackData = {"connect_model": {}}
    callbackData["connect_model"][modelName] = {}
    callbackData["connect_model"][modelName][eventName] = [this._primaryKey()]

    return App.cable.subscriptions.create(
      {channel: "ModelUpdates::EventsChannel", callback_data: callbackData},
      {received: callback}
    )
  }

  assignAttributes(newAttributes) {
    for(var key in newAttributes) {
      var oldValue = this.modelData[key]
      var newValue = newAttributes[key]

      if (oldValue != newValue)
        this.changes[key] = newValue
    }
  }

  cacheKey() {
    if (this.isPersisted()) {
      var keyParts = [
        this.modelClassData().paramKey,
        this._primaryKey()
      ]

      if ("updated_at" in this.modelData) {
        keyParts.push(`updatedAt-${this.updatedAt().getTime()}`)
      }

      return keyParts.join("-")
    } else {
      return this.uniqueKey()
    }
  }

  hasChanged() {
    if (this.changes.length > 0) {
      return true
    } else {
      return false
    }
  }

  create() {
    return new Promise((resolve, reject) => {
      var paramKey = this.modelClassData().paramKey
      var urlToUse = this.modelClassData().path
      var modelData = this._saveData()
      var dataToUse = {}
      dataToUse[paramKey] = modelData

      Api.post(urlToUse, dataToUse).then((response) => {
        if (response.success) {
          if (response.model) {
            this.modelData = response.model
            this.changes = {}
          }

          resolve({"model": this, "response": response})
        } else {
          reject({"model": this, "response": response})
        }
      }, (response) => {
        reject({"model": this, "response": response})
      })
    })
  }

  createRaw(data) {
    return new Promise((resolve, reject) => {
      var paramKey = this.modelClassData().paramKey
      var urlToUse = this.modelClassData().path

      Api.requestLocal({path: urlToUse, method: "POST", rawData: data}).then((response) => {
        if (response.success) {
          if (response.model) {
            this.modelData = response.model
            this.changes = {}
          }

          resolve({"model": this, "response": response})
        } else {
          reject({"model": this, "response": response})
        }
      }, (response) => {
        reject({"model": this, "response": response})
      })
    })
  }

  destroy() {
    return new Promise((resolve, reject) => {
      var urlToUse = `${this.modelClassData().path}/${this._primaryKey()}`

      Api.delete(urlToUse).then((response) => {
        if (response.success) {
          if (response.model) {
            this.modelData = response.model
            this.changes = {}
          }

          resolve(response)
        } else {
          reject(response)
        }
      }, (response) => {
        reject({"model": this, "response": response})
      })
    })
  }

  static humanAttributeName(attributeName) {
    var keyName = this.modelClassData().paramKey
    return I18n.t(`activerecord.attributes.${keyName}.${BaseModel.snakeCase(attributeName)}`)
  }

  static snakeCase(string) {
    var changeCase = require("change-case")
    return changeCase.snakeCase(string).replace(/\d+/, "_$&")
  }

  isChanged() {
    var length = Object.keys(this.changes)

    if (length > 0) {
      return true
    } else {
      return false
    }
  }

  isNewRecord() {
    if ("id" in this.modelData && this.modelData.id) {
      return false
    } else {
      return true
    }
  }

  isPersisted() {
    return !this.isNewRecord()
  }

  modelClassData() {
    return this.constructor.modelClassData()
  }

  reload() {
    return new Promise((resolve, reject) => {
      var urlToUse = `${this.modelClassData().path}/${this._primaryKey()}`

      Api.get(urlToUse).then((response) => {
        if (response.model) {
          this.modelData = response.model
          this.changes = {}
        }

        resolve(response)
      }, (response) => {
        reject({"model": this, "response": response})
      })
    })
  }

  save() {
    if (this.isNewRecord()) {
      return this.create()
    } else {
      return this.update()
    }
  }

  saveRaw(rawData) {
    if (this.isNewRecord()) {
      return this.createRaw(rawData)
    } else {
      return this.updateRaw(rawData)
    }
  }

  update(newAttributes = null) {
    if (newAttributes)
      this.assignAttributes(newAttributes)

    return new Promise((resolve, reject) => {
      if (this.changes.length == 0)
        return resolve({model: this})

      var paramKey = this.modelClassData().paramKey
      var urlToUse = `${this.modelClassData().path}/${this._primaryKey()}`
      var dataToUse = {}
      dataToUse[paramKey] = this.changes

      if (Object.keys(dataToUse[paramKey]).length == 0)
        return resolve(resolve({"model": this}))

      Api.patch(urlToUse, dataToUse).then((response) => {
        if (response.success) {
          if (response.model) {
            this.modelData = response.model
            this.changes = {}
          }

          resolve({"model": this, "response": response})
        } else {
          reject({"model": this, "response": response})
        }
      }, (response) => {
        reject({"model": this, "response": response})
      })
    })
  }

  updateRaw(data) {
    return new Promise((resolve, reject) => {
      var paramKey = this.modelClassData().paramKey
      var urlToUse = `${this.modelClassData().path}/${this._primaryKey()}`

      Api.requestLocal({path: urlToUse, method: "PATCH", rawData: data}).then((response) => {
        if (response.success) {
          if (response.model) {
            this.modelData = response.model
            this.changes = {}
          }

          resolve({"model": this, "response": response})
        } else {
          reject({"model": this, "response": response})
        }
      }, (response) => {
        reject({"model": this, "response": response})
      })
    })
  }

  isValid() {
    throw "Not implemented yet"
  }

  isValidOnServer() {
    return new Promise((resolve, reject) => {
      var paramKey = this.modelClassData().paramKey
      var urlToUse = `${this.modelClassData().path}/validate`
      var modelData = this._saveData()
      var dataToUse = {}
      dataToUse[paramKey] = modelData

      Api.post(urlToUse, dataToUse).then((response) => {
        resolve({"valid": response.valid, "errors": response.errors})
      }, (response) => {
        reject({"model": this, "response": response})
      })
    })
  }

  modelClass() {
    return this.constructor
  }

  preloadRelationship(relationshipName, model) {
    this.relationshipsCache[BaseModel.snakeCase(relationshipName)] = model
  }

  uniqueKey() {
    if (!this.uniqueKeyValue) {
      var min = 500000000000000000
      var max = 999999999999999999
      var randomBetween = Math.floor(Math.random() * (max - min + 1) + min)
      this.uniqueKeyValue = randomBetween
    }

    return this.uniqueKeyValue
  }

  static _callCollectionMethod(args) {
    return new Promise((resolve, reject) => {
      var url = `/api_maker/${args.modelClass.modelClassData().pluralName}/${args.collectionMethod}`
      var postData = {
        args: args.args,
        plural_name: args.modelClass.modelClassData().pluralName,
        collection_method: args.collectionMethod
      }

      Api.post(url, postData).then((response) => {
        resolve(response)
      }, (response) => {
        reject(response)
      })
    })
  }

  _callMemberMethod(args) {
    return new Promise((resolve, reject) => {
      var url = `/api_maker/${args.model.modelClassData().pluralName}/${args.model.id()}/${args.memberMethod}`
      var postData = {
        args: args.args,
        plural_name: args.model.modelClassData().pluralName,
        member_method: args.memberMethod
      }

      Api.post(url, postData).then((response) => {
        resolve(response)
      }, (response) => {
        reject(response)
      })
    })
  }

  _getAttribute(attributeName) {
    if (attributeName in this.changes) {
      return this.changes[attributeName]
    } else if (attributeName in this.modelData) {
      return this.modelData[attributeName]
    } else if (this.isNewRecord()) {
      // Return null if this is a new record and the attribute name is a recognized attribute
      var attributes = this.modelClassData().attributes
      for(var key in attributes) {
        var attribute = attributes[key]

        if (attribute.name == attributeName)
          return null
      }
    }

    throw `No such attribute: ${attributeName}`
  }

  _getAttributeDateTime(attributeName) {
    var value = this._getAttribute(attributeName)
    if (!value)
      return value

    if (value instanceof Date)
      return value

    // Format is 2018-07-22T06:17:08.297Z
    var match = value.match(/^(\d+)-(\d+)-(\d+)T(\d+):(\d+):(\d+)\.(\d+)Z$/)

    // Sometimes format is 2018-06-17T09:19:12.576+02:00
    if (!match)
      match = value.match(/^(\d+)-(\d+)-(\d+)T(\d+):(\d+):(\d+)\.(\d+)\+(\d+):(\d+)$/)

    if (!match)
      match = value.match(/^(\d+)-(\d+)-(\d+) (\d+):(\d+):(\d+)$/)

    if (match.length > 0) {
      return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]), parseInt(match[4]), parseInt(match[5]), parseInt(match[6]))
    } else {
      throw `Could not read datetime: ${value}`
    }
  }

  _isPresent(value) {
    if (!value) {
      return false
    } else if (typeof value == "string" && value.match(/^\s*$/)) {
      return false
    }

    return true
  }

  _getAttributeMoney(attributeName) {
    var value = this._getAttribute(attributeName)

    if (!value)
      return null

    var cents = parseInt(value.fractional)
    var currency = value.currency.iso_code
    return Money.fromInteger(cents, currency)
  }

  _preloadRelationships() {
    var modelClassData = this.modelClassData()
    var thisModelData = this.modelData

    for(var key in modelClassData.relationships) {
      var relationship = modelClassData.relationships[key]
      var preloadedData = this.modelData[relationship.name]

      if (!(relationship.name in this.modelData))
        continue

      if (!preloadedData) {
        this.relationshipsCache[relationship.name] = null
        continue
      }

      var modelClass = require(`ApiMaker/Models/${relationship.className}`).default

      if (relationship.macro == "belongs_to" || relationship.macro == "has_one") {
        var modelInstance = new modelClass(preloadedData)
        this.preloadRelationship(relationship.name, modelInstance)
        delete this.modelData[relationship.name]
      } else if(relationship.macro == "has_many") {
        var preloadedModels = []
        for(var key in preloadedData) {
          var modelData = preloadedData[key]
          var modelInstance = new modelClass(modelData)
          preloadedModels.push(modelInstance)
        }

        this.preloadRelationship(relationship.name, preloadedModels)
        delete this.modelData[relationship.name]
      } else {
        console.log(`Cannot preload this type of relationship yet: ${relationship.name} - ${relationship.macro}`)
      }
    }
  }

  _loadBelongsToReflection(args) {
    return new Promise((resolve, reject) => {
      if (args.reflectionName in this.relationshipsCache) {
        resolve(this.relationshipsCache[args.reflectionName])
      } else {
        var collection = new Collection(args)
        collection.first().then((model) => {
          this.relationshipsCache[args.reflectionName] = model
          resolve(model)
        })
      }
    })
  }

  _readBelongsToReflection(args) {
    if (!(args.reflectionName in this.relationshipsCache)) {
      if (this.isNewRecord())
        return null

      throw `${args.reflectionName} hasnt been loaded yet`
    }

    return this.relationshipsCache[args.reflectionName]
  }

  _loadHasOneReflection(args) {
    return new Promise((resolve, reject) => {
      if (args.reflectionName in this.relationshipsCache) {
        resolve(this.relationshipsCache[args.reflectionName])
      } else {
        var collection = new Collection(args)
        collection.first().then((model) => {
          this.relationshipsCache[args.reflectionName] = model
          resolve(model)
        })
      }
    })
  }

  _readHasOneReflection(args) {
    if (!(args.reflectionName in this.relationshipsCache)) {
      if (this.isNewRecord())
        return null

      throw `${args.reflectionName} hasnt been loaded yet`
    }

    return this.relationshipsCache[args.reflectionName]
  }

  _primaryKey() {
    return this._getAttribute(this.modelClassData().primaryKey)
  }

  _saveData() {
    return Object.assign({}, this.modelData, this.changes)
  }

  static _token() {
    var csrfTokenElement = document.querySelector("meta[name='csrf-token']")
    if (csrfTokenElement)
      return csrfTokenElement.getAttribute("content")
  }
}
