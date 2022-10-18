import { useReducer } from 'react'

import { Button, Chip, Link, Stack, Typography } from '@mui/material'
import Highlighter from 'react-highlight-words'

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
    linksIdx,
    chunksIdx
  ] = tuple
  return {
    nouns: data.nouns[nounsIdx],
    adjectives: data.adjectives[adjectivesIdx],
    places: data.places[placesIdx],
    titles: data.titles[titlesIdx],
    years: data.years[yearsIdx],
    descriptions: data.descriptions[descriptionsIdx],
    links: data.links[linksIdx],
    chunks: data.chunks[chunksIdx]
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

const STAGE_INSTRUCTIONS = {
  [STAGES.START]: "Mit dem Start-Button geht's los!",
  [STAGES.ADJECTIVE]: 'Welches Attribut trifft am ehesten auf dich zu?',
  [STAGES.NOUN]: 'Welcher dieser Charaktere trifft am ehesten auf dich zu?',
  [STAGES.PLACE]: 'Zu welcher Stadt fühlst du dich am ehesten zugehörig?',
  [STAGES.RESULT]: 'Das ist dein Tatort-Charakter:'
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

const filterTuples = (tuples, choicesMade) => {
  return tuples.filter(tuple =>
    Object.entries(choicesMade).reduce(
      (acc, [stage, choice]) => acc && tuple[stage] === choice,
      true
    )
  )
}

const STAGE_INITIAL_STATE = {
  stage: STAGES.START,
  choicesAvailable: {},
  choicesMade: {},
  canReroll: true,
  tuples: TUPLES
}

const STAGE_ACTIONS = {
  START: 'start',
  CHOOSE: 'choose',
  REROLL: 'reroll',
  BACK: 'back',
  RESET: 'reset'
}

const stageReducer = (state, action) => {
  console.log('reducing', state, action)
  switch (action.type) {
    case STAGE_ACTIONS.START:
      return {
        ...state,
        stage: STAGES.ADJECTIVE,
        choicesAvailable: {
          [STAGES.ADJECTIVE]: getRandomOptions(
            TUPLES.map(tuple => tuple.adjectives),
            3
          )
        }
      }
    case STAGE_ACTIONS.CHOOSE:
      const nextChoicesMade = {
        ...state.choicesMade,
        [state.stage]: action.payload
      }
      const filteredTuples = filterTuples(state.tuples, nextChoicesMade)
      const nextStage = NEXT_STAGE[state.stage]

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
        canReroll: filteredTuples.length > 3,
        choicesMade: nextChoicesMade,
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
      const prevChoicesMade = {
        ...state.choicesMade
      }
      const filteredTuples_ = filterTuples(TUPLES, prevChoicesMade)
      delete prevChoicesMade[PREVIOUS_STAGE[state.stage]]
      return {
        ...state,
        stage: PREVIOUS_STAGE[state.stage],
        choicesMade: prevChoicesMade,
        tuples: filteredTuples_,
        canReroll: filteredTuples_.length > 3
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

  const handleStart = () => {
    dispatch({ type: STAGE_ACTIONS.START })
  }

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
    <div className={styles.app}>
      {/* <Typography variant='h1'>Tatort – Wer bin ich?</Typography>
      <Typography type='subtitle1'>
        Finde heraus, welcher Tatort dir am ähnlichsten ist!
      </Typography> */}

      <Stack
        direction={'row'}
        gap={'10px'}
        alignItems={'start'}
        className={styles.controls}
      >
        {[STAGES.NOUN, STAGES.PLACE, STAGES.RESULT].includes(stage.stage) && (
          <Button variant='contained' onClick={handleBack}>
            Zurück
          </Button>
        )}

        {[STAGES.ADJECTIVE, STAGES.NOUN, STAGES.PLACE].includes(stage.stage) &&
          stage.canReroll && (
            <Button variant='contained' onClick={handleReroll}>
              Neue Wörter
            </Button>
          )}

        {stage.stage !== STAGES.START && (
          <Button variant='contained' onClick={handleReset}>
            Reset
          </Button>
        )}
      </Stack>

      {stage.stage === STAGES.RESULT && (
        <div className={styles.controlSpacer} />
      )}

      {![STAGES.START, STAGES.ADJECTIVE].includes(stage.stage) && (
        <Stack direction={'row'} gap={'10px'} className={styles.choicesMade}>
          {Object.entries(stage.choicesMade).map(([stage, choice]) => (
            <Chip key={stage} label={choice} color='secondary' />
          ))}
        </Stack>
      )}

      <Typography>{STAGE_INSTRUCTIONS[stage.stage]}</Typography>

      {stage.stage === STAGES.START && (
        <Button variant='contained' onClick={() => handleStart()}>
          Start
        </Button>
      )}

      {![STAGES.START, STAGES.RESULT].includes(stage.stage) && (
        <Stack
          direction={'row'}
          gap={'10px'}
          flexWrap={'wrap'}
          justifyContent={'center'}
          className={styles.choices}
        >
          {stage.choicesAvailable[stage.stage].map(choice => (
            <Button
              key={choice}
              variant='contained'
              onClick={() => handleChoose(choice)}
            >
              {choice}
            </Button>
          ))}
        </Stack>
      )}

      {stage.stage === STAGES.RESULT && (
        <Chip
          variant='outlined'
          color='secondary'
          label={stage.tuples[0].chunks}
        />
      )}

      {stage.stage === STAGES.RESULT && (
        <div className={styles.resultWrapper}>
          <div className={styles.fadeGradientTop} />
          <div className={styles.fadeGradientBottom} />

          <Stack
            direction='column'
            alignItems={'start'}
            className={styles.result}
          >
            <Typography variant='h2'>
              <Highlighter
                highlightClassName={styles.descriptionHighlight}
                searchWords={[stage.tuples[0].chunks]}
                autoEscape={true}
                textToHighlight={stage.tuples[0].titles}
              />
            </Typography>
            <Typography variant='subtitle2'>{stage.tuples[0].years}</Typography>
            <Link target='_blank' href={stage.tuples[0].links}>
              Link zur Folge
            </Link>
            <br />
            <Typography variant='body2'>
              <Highlighter
                highlightClassName={styles.descriptionHighlight}
                highlightStyle={{
                  whiteSpace:
                    stage.tuples[0].chunks.length > 40 ? 'pre-wrap' : 'nowrap'
                }}
                searchWords={[stage.tuples[0].chunks]}
                autoEscape={true}
                textToHighlight={stage.tuples[0].descriptions}
              />
            </Typography>
          </Stack>
        </div>
      )}
    </div>
  )
}

export default App
