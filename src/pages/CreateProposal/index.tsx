import { extractError, notify } from '../../blockchain-bridge/scrt/utils';
import { useHistory } from "react-router-dom";
import ProposalLayout from 'components/ProposalLayout';
import { observer } from 'mobx-react';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Popup } from 'semantic-ui-react';
import { useStores } from 'stores';
import './style.scss';
import { sleep } from 'utils';

const CreateProposal = observer((props) => {

  const history = useHistory();

  const { theme, user } = useStores();

  const [formData, updateFormData] = React.useState({
    title: '',
    description: '',
    vote_type: '',
    author_alias: '',
  });

  const [loading, setLoading] = React.useState<boolean>(false);

  const [errors, setErrors] = useState([]);


  function handleChange(e) {

    updateFormData({
      ...formData,
      // Trimming any whitespace
      [e.target.name]: e.target.value.trim()
    });
  };

  async function createProposal(event) {

    event.preventDefault();
    setLoading(true);

    try {
      const result = await user.createProposal(formData.title, formData.description, formData.vote_type, formData.author_alias);
      if (result?.code) {
        const message = extractError(result)
        notify('error', message, 10, result.txhash, true)
        setLoading(false);
      } else {
        notify('success', 'Proposal created successfully', 10, '', true)
        await sleep(3000)
        setLoading(false);
        history.push('/governance')
      }
    } catch (error) {
      notify('error', error.toString(), 10, '', true);
    } finally {
      setLoading(false);
    }
  }

  function isValid() {
    return !formData.title
      || !formData.vote_type
      || !formData.author_alias 
      || !formData.description
      || formData.title.length < 2
      || formData.description.length < 10
      || formData.author_alias.length < 3
  }

  function formatErrors() {
    return errors.map((e, i) => {
      return (
        <p key={i}>{e.msg}</p>
      );
    });
  }

  function validateForm() {

    const result = [];

    if (!formData.title ||!formData.vote_type || !formData.author_alias || !formData.description)  {
      result.push({
        type: 'field',
        msg: `All fields are required`
      });
    }else if (formData.title.length < 2 ){
      result.push({
        type: 'field',
        msg: `Minimum characteres required in title field is 2`
      })
    }else if (formData.author_alias.length < 3){
      result.push({
        type: 'field',
        msg: `Minimum characteres required in proposer name field is 3`
      })
    } else if (formData.description.length < 10) {
      result.push({
        type: 'field',
        msg: `Minimum characteres required in description field is 10`
      });
    }
    setErrors(result);
  }

  useEffect(() => {
    validateForm();
  }, [formData]);

  return (
    <ProposalLayout width='1168px'>
      <form onSubmit={createProposal} className={`create-proposal ${theme.currentTheme}`} action="">
        <div className='title-section'>
          <h1>Create proposal</h1>
          <div className='title-section__buttons'>
            <Button
              className='g-button--outline'>
              <Link to='/governance'>Cancel</Link>
            </Button>

            <Popup
              style={{ color: 'red' }}
              content={formatErrors()}
              disabled={errors.length <= 0}
              trigger={<a>
                <Button
                  loading={loading}
                  disabled={isValid()}
                  className='g-button'
                >
                  Create Proposal
                </Button>
              </a>}
            />
          </div>
        </div>
        <div className='card-proposal'>

          <div className='form-title'>
            <label htmlFor="title">Title</label>
            <input onChange={handleChange} id='title' name='title' type="text" autoComplete="off" />
          </div>
          <div className="form-proposal">
            <label htmlFor="vote_type">Proposal Type</label>
            <label htmlFor="author_alias">Proposer Name: </label>

            <select onChange={handleChange} name="vote_type" id="proposal">
              <option value="">-- Choose One --</option>
              <option value="SEFI Rewards Pool">SEFI Rewards Pool</option>
              <option value="SEFI Community Spending">SEFI Community Spending</option>
              <option value="SecretSwap Parameter Change">SecretSwap Parameter Change</option>
              <option value="Other">Other</option>
            </select>
            <input
              onChange={handleChange}
              id='author_alias'
              name='author_alias'
              type="text"
              autoComplete="off"
            />
          </div>
          <div className='form-description'>
            <label htmlFor="description">Description</label>
            <textarea
              // maxLength={250}
              onChange={handleChange}
              name="description"
              id="description"
              cols={60}
              rows={20}
            />
          </div>
        </div>

      </form>

    </ProposalLayout>
  )
})

export default CreateProposal;
