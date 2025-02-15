module ApiMaker::ModelExtensions
  def self.included(base)
    base.extend(ClassMethods)
  end

  module ClassMethods
    def api_maker_broadcast_creates
      after_commit on: :create do |model|
        channel_name = "api_maker_creates_#{model.class.name}"
        serializer = ApiMaker::Serializer.new(model: model)
        data_to_broadcast = ApiMaker::ResultParser.parse(
          model: model,
          model_class_name: model.class.name,
          model_id: model.id,
          model_type: serializer.resource.collection_name,
          type: :create
        )
        ActionCable.server.broadcast(channel_name, data_to_broadcast)
      end
    end

    def api_maker_broadcast_updates
      after_commit on: :update do |model| # rubocop:disable Style/SymbolProc
        model.api_maker_broadcast_update
      end
    end

    def api_maker_broadcast_destroys
      after_commit on: :destroy do |model|
        channel_name = "api_maker_destroys_#{model.class.name}_#{model.id}"
        serializer = ApiMaker::Serializer.new(model: model)
        data_to_broadcast = ApiMaker::ResultParser.parse(
          model: model,
          model_id: model.id,
          model_type: serializer.resource.collection_name,
          type: :destroy
        )

        ActionCable.server.broadcast(channel_name, data_to_broadcast)
      end
    end
  end

  def api_maker_event(event_name, args = {})
    channel_name = "api_maker_events_#{self.class.name}_#{id}_#{event_name}"
    serializer = ApiMaker::Serializer.new(model: self)
    data_to_broadcast = ApiMaker::ResultParser.parse(
      args: args,
      event_name: event_name,
      model_id: id,
      model_type: serializer.resource.collection_name,
      type: :event
    )

    ActionCable.server.broadcast(channel_name, data_to_broadcast)
  end

  def api_maker_broadcast_update
    channel_name = "api_maker_updates_#{self.class.name}_#{id}"
    serializer = ApiMaker::Serializer.new(model: self)
    data_to_broadcast = ApiMaker::ResultParser.parse(
      model: self,
      model_id: id,
      model_type: serializer.resource.collection_name,
      type: :update
    )

    ActionCable.server.broadcast(channel_name, data_to_broadcast)
  end
end
