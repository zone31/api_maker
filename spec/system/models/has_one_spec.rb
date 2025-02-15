require "rails_helper"

describe "model belongs to relationships" do
  let!(:project) { create :project }
  let!(:project_detail) { create :project_detail, project: project }
  let(:user) { create :user }

  it "finds the parent model" do
    login_as user

    visit models_has_one_path(project_id: project.id)

    expect(page).to have_current_path models_has_one_path, ignore_query: true

    wait_for_chrome { find("[data-controller='models--has-one']", visible: false)["data-has-one-completed"] == "true" }

    project_detail_data = JSON.parse(find("[data-controller='models--has-one']", visible: false)["data-project-detail"])

    expect(project_detail_data).to eq("id" => project_detail.id, "details" => project_detail.details)
  end
end
