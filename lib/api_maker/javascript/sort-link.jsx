import { Link } from "react-router-dom"
import qs from "qs"
import React from "react"

const inflection = require("inflection")

export default class extends React.Component {
  constructor(props) {
    super(props)

    var searchKey = this.props.query.queryArgs.searchKey
    if (!searchKey)
      searchKey = "q"

    this.state = {searchKey: searchKey}
  }

  attribute() {
    return inflection.underscore(this.props.attribute)
  }

  href() {
    var currentParams = qs.parse(window.location.search.substr(1))

    if (!currentParams[this.state.searchKey])
      currentParams[this.state.searchKey] = {}

    currentParams[this.state.searchKey]["s"] = `${this.attribute()} ${this.sortMode()}`

    var newParams = qs.stringify(currentParams)
    var newPath = `${location.pathname}?${newParams}`

    return newPath
  }

  isSortedByAttribute() {
    if (this.props.query.queryArgs.ransack && this.props.query.queryArgs.ransack.s == this.attribute())
      return true

    if (this.props.query.queryArgs.ransack && this.props.query.queryArgs.ransack.s == `${this.attribute()} asc`)
      return true

    return false
  }

  render() {
    var LinkComponent = this.linkComponent()
    var { attribute, className, linkComponent, query, title, ...other } = this.props

    return (
      <LinkComponent {...other} className={this.className()} data-attribute={attribute} data-sort-mode={this.sortMode()} to={this.href()}>
        {this.title()}
      </LinkComponent>
    )
  }

  className() {
    var classNames = ["component-api-maker-bootstrap-sort-link"]

    if (this.props.className)
      classNames.push(this.props.className)

    return classNames.join(" ")
  }

  linkComponent() {
    if (this.props.linkComponent) {
      return this.props.linkComponent
    } else {
      return Link
    }
  }

  sortMode() {
    if (this.isSortedByAttribute()) {
      return "desc"
    } else {
      return "asc"
    }
  }

  title() {
    if (this.props.title)
      return this.props.title

    return this.props.query.modelClass().humanAttributeName(this.props.attribute)
  }
}
