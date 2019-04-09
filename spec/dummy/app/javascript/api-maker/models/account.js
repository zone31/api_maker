import BaseModel from "../base-model"
import Collection from "../collection"

export default class Account extends BaseModel {
  static modelClassData() {
    return {"attributes":[{"name":"id","type":"integer"},{"name":"name","type":"string"}],"collectionKey":"accounts","collectionName":"accounts","i18nKey":"account","name":"Account","pluralName":"accounts","relationships":[{"className":"Project","collectionName":"projects","name":"projects","macro":"has_many"}],"paramKey":"account","path":"/api_maker/accounts","primaryKey":"id"}
  }

  
    
      projects() {
        let id = this.id()
        let modelClass = require(`api-maker/models/project`).default
        return new Collection({"reflectionName":"projects","model":this,"modelName":"Project","modelClass":modelClass,"targetPathName":"/api_maker/projects"}, {"ransack":{"account_id_eq":id}})
      }
    
  

  
    
    id() {
      // integer
      
        return this._getAttribute("id")
      
    }

    hasId() {
      let value = this.id()
      return this._isPresent(value)
    }
  
    
    name() {
      // string
      
        return this._getAttribute("name")
      
    }

    hasName() {
      let value = this.name()
      return this._isPresent(value)
    }
  

  

  
}
