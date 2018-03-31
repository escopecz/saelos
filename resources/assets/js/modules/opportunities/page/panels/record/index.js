import React from 'react'
import PropTypes from 'prop-types'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { getUser } from '../../../../user/store/selectors'
import { getOpportunity, getCustomFieldsForOpportunities, isStateDirty, getFirstOpportunityId, isInEdit } from '../../../store/selectors';
import { fetchOpportunity, saveOpportunity, deleteOpportunity } from '../../../service';
import _ from 'lodash';
import * as MDIcons from 'react-icons/lib/md'
import {editingOpportunity, editingOpportunityFinished} from "../../../store/actions"
import {renderGroupedFields} from "../../../../../utils/helpers/fields"
import TagsPartial from '../../../../tags/partials/tags'

class Record extends React.Component {
  constructor(props) {
    super(props)

    this._toggleEdit = this._toggleEdit.bind(this)
    this._submit = this._submit.bind(this)
    this._handleInputChange = this._handleInputChange.bind(this)
    this._delete = this._delete.bind(this)

    this.state = {
      inEdit: props.inEdit,
      formState: props.opportunity.originalProps
    }
  }

  componentWillMount() {
    const { dispatch } = this.props

    if (this.props.match.params.id === 'new') {
      dispatch(editingOpportunity())
    } else {
      dispatch(fetchOpportunity(this.props.match.params.id))
    }
  }

  componentWillReceiveProps(nextProps, nextContext) {
    this.setState({formState: nextProps.opportunity.originalProps})
  }

  _delete () {
    const { dispatch, opportunity } = this.props

    if (confirm('Are you sure?')) {
      dispatch(deleteOpportunity(opportunity.id))
      this.context.router.history.push('/opportunities')
    }
  }

  _toggleEdit() {
    this.props.dispatch(editingOpportunity())
  }

  _submit() {
    this.props.dispatch(saveOpportunity(this.state.formState))
    this.props.dispatch(editingOpportunityFinished())
  }

  // @todo: Extract this crap. Mercy, this is embarrassing
  _handleInputChange(event) {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    let name = target.name;
    let opportunityState = this.state.formState;

    // Special handling for custom field state
    if (this.state.formState.hasOwnProperty(name) === false) {
      let customField = this.props.customFields[name];
      let opportunityCustomFieldIndex = _.findIndex(opportunityState.custom_fields, (o) => o.custom_field_id === customField.field_id);

      if (opportunityCustomFieldIndex >= 0) {
        opportunityState.custom_fields[opportunityCustomFieldIndex].value = value;
      } else {
        opportunityState.custom_fields.push({
          custom_field_id: customField.field_id,
          value: value
        });
      }
    } else {
      _.set(opportunityState, name, value);
    }

    this.setState({
      formState: opportunityState
    });
  }


  render() {
    const { opportunity, inEdit, user } = this.props;
    const groups = _.groupBy(this.props.customFields, 'group');

    const opportunityFields = renderGroupedFields(
      inEdit,
      ['core', 'personal', 'social', 'additional'],
      groups,
      opportunity,
      this._handleInputChange
    )

    const onAssignmentChange = (id) => {
      const event = {
        target: {
          type: 'text',
          name: 'user_id',
          value: id
        }
      }
      this._handleInputChange(event)
      this._submit()
    }

    if (opportunity.id === null || opportunity.id == 0) {
      return (
        <main className="col main-panel px-3 align-self-center">
          <h2 className="text-muted text-center">Select an opportunity on the left to view.</h2>
        </main>
        )
    }

    return (
      <main className="col main-panel px-3">
        <div className="toolbar border-bottom py-2 heading">
          <button className="btn btn-primary mr-3 btn-sm list-inline-item"><span className="h5"><MDIcons.MdAllInclusive /></span></button>
          <button className="btn btn-link mr-2 btn-sm list-inline-item"><span className="h2"><MDIcons.MdPlaylistAdd /></span></button>
          <button className="btn btn-link mr-2 btn-sm list-inline-item"><span className="h3"><MDIcons.MdInput /></span></button>
          <button className="btn btn-link mr-2 btn-sm list-inline-item"><span className="h2"><MDIcons.MdInsertChart /></span></button>
          <button className="btn btn-link mr-2 btn-sm list-inline-item" onClick={this._delete}><span className="h2"><MDIcons.MdDelete /></span></button>

          <div className="float-right text-right pt-2">
            <div className="mini-text text-muted">Assigned To</div>
            { user.authorized(['admin', 'manager']) ?
            <div className="dropdown show">
              <div className="text-dark mini-text cursor-pointer" id="assigneeDropdown" data-toggle="dropdown"><b>{opportunity.user.name ? opportunity.user.name : 'Unassigned'}</b></div>
              <div className="dropdown-menu" aria-labelledby="assigneeDropdown">
                {user.team.users.map(u => (
                  <a key={`team-${user.team.id}-member-${u.id}`} className="dropdown-item" href="javascript:void(0)" onClick={() => onAssignmentChange(u.id)}>{u.name}</a>
                ))}
              </div>
            </div>
            : <div className="text-dark mini-text"><b>{opportunity.user.name ? opportunity.user.name : 'Unassigned'}</b></div> }
          </div>
        </div>

        {inEdit ?
          <span className="float-right py-3 mt-1">
              <a href="javascript:void(0);" onClick={this._toggleEdit}>Cancel</a>
              <span className="ml-2 btn btn-primary btn-sm" onClick={this._submit}>Save</span>
            </span>
          :
          <span className="float-right py-3 mt-1">
              <a href="javascript:void(0);" onClick={this._toggleEdit}>Edit</a>
            </span>
        }
        <h4 className="border-bottom py-3">
          {opportunity.name}
          <TagsPartial tags={opportunity.tags} entityId={opportunity.id} entityType="App\Opportunity" />
        </h4>

        <div className="h-scroll">
          <div className="card mb-1">
            {opportunityFields}
          </div>
        </div>
      </main>
    )
  }
}

Record.propTypes = {
  opportunity: PropTypes.object.isRequired
}

Record.contextTypes = {
  router: PropTypes.object.isRequired
}

export default withRouter(connect((state, ownProps) => ({
  opportunity: getOpportunity(state, ownProps.match.params.id || getFirstOpportunityId(state)),
  customFields: getCustomFieldsForOpportunities(state),
  isDirty: isStateDirty(state),
  user: getUser(state),
  inEdit: isInEdit(state)
}))(Record))
