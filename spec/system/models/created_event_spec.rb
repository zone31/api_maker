require "rails_helper"

describe "models created event" do
  let(:task) { create :task, name: "test create task", user: user }
  let(:task_from_other_user) { create :task }
  let(:user) { create :user }

  it "receives the created event and adds a row to the table for tasks the user have access to" do
    login_as user

    visit models_created_event_path

    wait_for_selector ".tasks-table"

    sleep 0.5 # Wait for ActionCable to connect

    expect(page).not_to have_selector ".task-row"

    task
    task_from_other_user

    wait_for_selector ".task-row[data-task-id='#{task.id}']"

    expect(find(".task-row[data-task-id='#{task.id}'] .id-column").text).to eq task.id.to_s
    expect(find(".task-row[data-task-id='#{task.id}'] .name-column").text).to eq "test create task"
    expect(page).not_to have_selector ".task-row[data-task-id='#{task_from_other_user.id}']"
  end
end
