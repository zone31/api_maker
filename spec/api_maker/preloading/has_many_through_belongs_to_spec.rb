require "rails_helper"

describe "preloading - has many through belongs to" do
  let!(:account) { create :account }
  let!(:marked_task) { create :account_marked_task, account: account, task: task }
  let!(:task) { create :task, user: user }

  let!(:another_account) { create :account }
  let!(:same_marked_task) { create :account_marked_task, account: another_account, task: task }

  let(:user) { create :user }
  let(:user_ability) { ApiMaker::Ability.new(args: {current_user: user}) }

  it "preloads without messing it up" do
    collection = Account.where(id: [account.id, another_account.id])
    result = JSON.parse(ApiMaker::CollectionSerializer.new(ability: user_ability, collection: collection, include_param: ["tasks"]).to_json)

    expect(result.dig("data", "accounts")).to eq [account.id, another_account.id]
    expect(result.dig("included", "accounts", account.id.to_s, "r", "tasks")).to eq [task.id]
    expect(result.dig("included", "accounts", another_account.id.to_s, "r", "tasks")).to eq [task.id]
    expect(result.fetch("included").fetch("tasks").length).to eq 1
  end
end
