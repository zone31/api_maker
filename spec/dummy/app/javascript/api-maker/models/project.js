import BaseModel from "../base-model"
import Collection from "../collection"

export default class Project extends BaseModel {
  static modelClassData() {
    return {"attributes":[{"name":"id","type":"integer"},{"name":"name","type":"string"},{"name":"created_at","type":"datetime"},{"name":"price_per_hour","type":"money"}],"collectionKey":"projects","collectionName":"projects","i18nKey":"project","name":"Project","pluralName":"projects","relationships":[{"className":"ProjectDetail","collectionName":"project-details","name":"project_detail","macro":"has_one"},{"className":"Task","collectionName":"tasks","name":"tasks","macro":"has_many"}],"paramKey":"project","path":"/api_maker/projects","primaryKey":"id"}
  }

  
    
      loadProjectDetail() {
        let id = this.id()
        let modelClass = require(`api-maker/models/project-detail`).default
        return this._loadHasOneReflection({"reflectionName":"project_detail","model":this,"modelClass":modelClass}, {"ransack":{"project_id_eq":id}})
      }

      projectDetail() {
        let modelClass = require(`api-maker/models/project-detail`).default
        return this._readHasOneReflection({"reflectionName":"project_detail","model":this,"modelClass":modelClass})
      }
    
  
    
      tasks() {
        let id = this.id()
        let modelClass = require(`api-maker/models/task`).default
        return new Collection({"reflectionName":"tasks","model":this,"modelName":"Task","modelClass":modelClass,"targetPathName":"/api_maker/tasks"}, {"ransack":{"project_id_eq":id}})
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
  
    
    createdAt() {
      // datetime
      
        return this._getAttributeDateTime("created_at")
      
    }

    hasCreatedAt() {
      let value = this.createdAt()
      return this._isPresent(value)
    }
  
    
    pricePerHour() {
      // money
      
        return this._getAttributeMoney("price_per_hour")
      
    }

    hasPricePerHour() {
      let value = this.pricePerHour()
      return this._isPresent(value)
    }
  

  

  
}
