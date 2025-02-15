import Api from "./api"
import CustomError from "./custom-error"
import Deserializer from "./deserializer"
import FormDataToObject from "./form-data-to-object"
import objectToFormData from "object-to-formdata"

export default class ApiMakerCommandsPool {
  static addCommand(data, args = {}) {
    if (args.instant) {
      var pool = new ApiMakerCommandsPool()
    } else {
      var pool = ApiMakerCommandsPool.current()
    }

    var promiseResult = pool.addCommand(data)

    if (args.instant) {
      pool.flush()
    } else {
      pool.setFlushTimeout()
    }

    return promiseResult
  }

  static current() {
    if (!window.currentApiMakerCommandsPool)
      window.currentApiMakerCommandsPool = new ApiMakerCommandsPool()

    return window.currentApiMakerCommandsPool
  }

  static flush() {
    ApiMakerCommandsPool.current().flush()
  }

  constructor() {
    this.pool = {}
    this.poolData = {}
    this.currentId = 1
    this.globalRequestData = null
  }

  addCommand(data) {
    return new Promise((resolve, reject) => {
      var id = this.currentId
      this.currentId += 1

      var commandType = data.type
      var commandName = data.command
      var collectionKey = data.collectionKey

      this.pool[id] = {resolve: resolve, reject: reject}

      if (!this.poolData[commandType])
        this.poolData[commandType] = {}

      if (!this.poolData[commandType][collectionKey])
        this.poolData[commandType][collectionKey] = {}

      if (!this.poolData[commandType][collectionKey][commandName])
        this.poolData[commandType][collectionKey][commandName] = {}

      if (data.args instanceof FormData) {
        var args = FormDataToObject.toObject(data.args)
      } else {
        var args = data.args
      }

      this.poolData[commandType][collectionKey][commandName][id] = {
        args: args,
        primary_key: data.primaryKey,
        id: id
      }
    })
  }

  async flush() {
    if (Object.keys(this.pool) == 0)
      return

    this.clearTimeout()

    var currentPool = this.pool
    var currentPoolData = this.poolData

    this.pool = {}
    this.poolData = {}

    var objectForFormData = {pool: currentPoolData}

    if (this.globalRequestData)
      objectForFormData.global = this.globalRequestData

    var formData = objectToFormData(objectForFormData)
    var url = `/api_maker/commands`
    var response = await Api.requestLocal({path: url, method: "POST", rawData: formData})

    for(var commandId in response.responses) {
      var commandResponse = response.responses[commandId]
      var commandResponseData = Deserializer.parse(commandResponse.data)
      var commandData = currentPool[parseInt(commandId)]

      if (commandResponse.type == "success") {
        commandData.resolve(commandResponseData)
      } else if (commandResponse.type == "error") {
        commandData.reject(new CustomError("Command error", {response: commandResponseData}))
      } else {
        commandData.reject(new CustomError("Command failed", {response: commandResponseData}))
      }
    }
  }

  clearTimeout() {
    if (this.flushTimeout)
      clearTimeout(this.flushTimeout)
  }

  setFlushTimeout() {
    this.clearTimeout()
    this.flushTimeout = setTimeout(() => this.flush(), 0)
  }
}
