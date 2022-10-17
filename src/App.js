import { useReducer } from 'react'

import Button from '@mui/material/Button'

import styles from './App.module.scss'

import data from './data.json'

console.log(data)

const TUPLES = data.tuples.map(tuple => {
  const [
    nounsIdx,
    adjectivesIdx,
    placesIdx,
    titlesIdx,
    yearsIdx,
    descriptionsIdx,
    linksIdx
  ] = tuple
  return {
    nouns: data.nouns[nounsIdx],
    adjectives: data.adjectives[adjectivesIdx],
    places: data.places[placesIdx],
    titles: data.titles[titlesIdx],
    years: data.years[yearsIdx],
    descriptions: data.descriptions[descriptionsIdx],
    links: data.links[linksIdx]
  }
})

console.log(TUPLES)

const STAGES = {
  START: 'start',
  ADJECTIVE: 'adjectives',
  NOUN: 'nouns',
  PLACE: 'places',
  RESULT: 'result'
}

const NEXT_STAGE = {
  [STAGES.START]: STAGES.ADJECTIVE,
  [STAGES.ADJECTIVE]: STAGES.NOUN,
  [STAGES.NOUN]: STAGES.PLACE,
  [STAGES.PLACE]: STAGES.RESULT
}

const PREVIOUS_STAGE = Object.keys(NEXT_STAGE).reduce((acc, key) => {
  acc[NEXT_STAGE[key]] = key
  return acc
}, {})

const getRandomOptions = (options, count) => {
  const result = []
  const maxTries = 100
  let tries = 0
  console.log('options', options)
  while (result.length < count) {
    const randomIndex = Math.floor(Math.random() * options.length)
    const randomOption = options[randomIndex]
    //console.log(randomOption)
    if (!result.includes(randomOption)) {
      result.push(randomOption)
    }
    tries++
    if (tries > maxTries) {
      break
    }
  }
  return result
}

const filterTuples = (tuples, choice, stage) => {
  return tuples.filter(tuple => tuple[stage] === choice)
}

const STAGE_INITIAL_STATE = {
  stage: STAGES.ADJECTIVE,
  choicesAvailable: {
    [STAGES.ADJECTIVE]: getRandomOptions(
      TUPLES.map(tuple => tuple.adjectives),
      3
    )
  },
  choices: {},
  tuples: TUPLES
}

const STAGE_ACTIONS = {
  CHOOSE: 'choose',
  REROLL: 'reroll',
  BACK: 'back',
  RESET: 'reset'
}

const stageReducer = (state, action) => {
  console.log('reducing', state, action)
  switch (action.type) {
    case STAGE_ACTIONS.CHOOSE:
      const filteredTuples = filterTuples(
        state.tuples,
        action.payload,
        state.stage
      )
      const nextStage = NEXT_STAGE[state.stage]

      console.log('filteredTuples', filteredTuples)
      return {
        ...state,
        stage: nextStage,
        choicesAvailable: {
          ...state.choicesAvailable,
          // TODO: Maybe choose from unique options only?
          [nextStage]: getRandomOptions(
            filteredTuples.map(tuple => tuple[nextStage]),
            3
          )
        },
        choicesMade: {
          ...state.choices,
          [state.stage]: action.payload
        },
        tuples: filteredTuples
      }
    case STAGE_ACTIONS.REROLL:
      return {
        ...state,
        choicesAvailable: {
          ...state.choicesAvailable,
          [state.stage]: getRandomOptions(
            state.tuples.map(tuple => tuple[state.stage]),
            3
          )
        }
      }
    case STAGE_ACTIONS.BACK:
      return {
        ...state,
        stage: PREVIOUS_STAGE[state.stage]
      }
    case STAGE_ACTIONS.RESET:
      return STAGE_INITIAL_STATE
    default:
      return state
  }
}

const App = () => {
  const [stage, dispatch] = useReducer(stageReducer, STAGE_INITIAL_STATE)
  console.log('stage', stage)

  const handleChoose = choice => {
    dispatch({ type: STAGE_ACTIONS.CHOOSE, payload: choice })
  }

  const handleReroll = () => {
    dispatch({ type: STAGE_ACTIONS.REROLL })
  }

  const handleBack = () => {
    dispatch({ type: STAGE_ACTIONS.BACK })
  }

  const handleReset = () => {
    dispatch({ type: STAGE_ACTIONS.RESET })
  }

  return (
    <div className={styles.App}>
      <h1>Tatort – Wer bin ich?</h1>
      <p>Finde heraus, welcher Tatort dir am ähnlichsten ist!</p>
      {[STAGES.ADJECTIVE, STAGES.NOUN, STAGES.PLACE].includes(stage.stage) && (
        <Button variant='contained' onClick={handleReroll}>
          Reroll
        </Button>
      )}
      <Button variant='contained' onClick={handleReset}>
        Reset
      </Button>
      {[STAGES.NOUN, STAGES.PLACE, STAGES.RESULT].includes(stage.stage) && (
        <Button variant='contained' onClick={handleBack}>
          Zurück (Broken)
        </Button>
      )}
      <div className={styles.choices}>
        {stage.choicesAvailable[stage.stage].map(choice => (
          <Button
            key={choice}
            variant='contained'
            onClick={() => handleChoose(choice)}
          >
            {choice}
          </Button>
        ))}
      </div>
    </div>
  )
}

export default App
