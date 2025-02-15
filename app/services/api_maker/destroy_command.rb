class ApiMaker::DestroyCommand < ApiMaker::BaseCommand
  attr_reader :command, :model, :params, :serializer

  def execute!
    each_command do |command|
      @command = command
      @model = command.model
      @params = command.args || {}
      @serializer = serialized_resource(model)

      if command.model.destroy
        success_response
      else
        failure_response
      end
    end

    ServicePattern::Response.new(success: true)
  end

  def failure_response
    command.fail(
      model: serializer.result,
      success: false,
      errors: model.errors.full_messages
    )
  end

  def serialized_resource(model)
    ApiMaker::Serializer.new(ability: current_ability, args: api_maker_args, model: model)
  end

  def success_response
    command.result(
      model: serializer.result,
      success: true
    )
  end
end
