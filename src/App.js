import { useReducer } from 'react'

import {
  Button as MUIButton,
  Chip as MUIChip,
  Link,
  Stack,
  Typography
} from '@mui/material'
import Highlighter from 'react-highlight-words'

import styles from './App.module.scss'

import data from './data.json'

console.log(data)

const Button = ({ children, ...props }) => (
  <MUIButton
    {...props}
    className={styles.button}
    disableElevation
    disableFocusRipple
    disableRipple
    disableTouchRipple
  >
    {children}
  </MUIButton>
)

const Chip = ({ children, ...props }) => (
  <MUIChip {...props} className={styles.chip}>
    {children}
  </MUIChip>
)

const TUPLES = data.tuples.map(tuple => {
  const [
    adjectiveTypeIdx,
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
    adjectiveTypes: data.adjective_types[adjectiveTypeIdx],
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
  ADJECTIVE_TYPE: 'adjectiveTypes',
  ADJECTIVE: 'adjectives',
  NOUN: 'nouns',
  PLACE: 'places',
  RESULT: 'result'
}

const STAGE_INSTRUCTIONS = {
  [STAGES.START]: "Mit dem Start-Button geht's los!",
  [STAGES.ADJECTIVE_TYPE]: 'Was für Eigenschaften interessieren dich?',
  [STAGES.ADJECTIVE]: 'Welches Attribut trifft am ehesten auf dich zu?',
  [STAGES.NOUN]: 'Welcher dieser Charaktere trifft am ehesten auf dich zu?',
  [STAGES.PLACE]: 'Zu welcher Stadt fühlst du dich am ehesten zugehörig?',
  [STAGES.RESULT]: 'Das ist dein Tatort-Charakter:'
}

const NEXT_STAGE = {
  [STAGES.START]: STAGES.ADJECTIVE_TYPE,
  [STAGES.ADJECTIVE_TYPE]: STAGES.ADJECTIVE,
  [STAGES.ADJECTIVE]: STAGES.NOUN,
  [STAGES.NOUN]: STAGES.PLACE,
  [STAGES.PLACE]: STAGES.RESULT
}

const PREVIOUS_STAGE = Object.keys(NEXT_STAGE).reduce((acc, key) => {
  acc[NEXT_STAGE[key]] = key
  return acc
}, {})

const getUnique = list => {
  const unique = []
  const seen = new Set()
  list.forEach(item => {
    if (!seen.has(item)) {
      unique.push(item)
      seen.add(item)
    }
  })
  return unique
}

const getRandomOptions = (options, count) => {
  const result = []
  const maxTries = 100
  let tries = 0

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
  choicesSeen: {},
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
  switch (action.type) {
    case STAGE_ACTIONS.START:
      const startChoicesAvailable = getUnique(
        TUPLES.map(tuple => tuple.adjectiveTypes)
      )
      return {
        ...state,
        stage: STAGES.ADJECTIVE_TYPE,
        choicesAvailable: {
          [STAGES.ADJECTIVE_TYPE]: startChoicesAvailable
        },
        choicesSeen: {
          [STAGES.ADJECTIVE_TYPE]: startChoicesAvailable
        }
      }
    case STAGE_ACTIONS.CHOOSE:
      const nextChoicesMade = {
        ...state.choicesMade,
        [state.stage]: action.payload
      }
      const filteredTuples = filterTuples(state.tuples, nextChoicesMade)
      const nextStage = NEXT_STAGE[state.stage]
      const nextChoicesList = getUnique(
        filteredTuples.map(tuple => tuple[nextStage])
      )
      const nextChoicesAvailable = getRandomOptions(nextChoicesList, 3)

      const nextState = {
        ...state,
        stage: nextStage,
        choicesAvailable: {
          ...state.choicesAvailable,
          // TODO: Maybe choose from unique options only?
          [nextStage]: nextChoicesAvailable
        },
        canReroll: nextChoicesList.length > 3,
        choicesMade: nextChoicesMade,
        choicesSeen: {
          ...state.choicesSeen,
          [nextStage]: nextChoicesAvailable
        },
        tuples: filteredTuples
      }

      // If the next stage has only one option available choose it instantly
      if (
        ![STAGES.RESULT].includes(nextStage) &&
        nextChoicesList.length === 1
      ) {
        return stageReducer(nextState, {
          type: STAGE_ACTIONS.CHOOSE,
          payload: nextChoicesAvailable[0]
        })
      } else {
        return nextState
      }
    case STAGE_ACTIONS.REROLL:
      let resetSeen = false
      let rerollPotentialChoices = getUnique(
        state.tuples.map(tuple => tuple[state.stage])
      ).filter(option => !state.choicesSeen[state.stage].includes(option))

      if (rerollPotentialChoices.length === 0) {
        rerollPotentialChoices = getUnique(
          state.tuples.map(tuple => tuple[state.stage])
        )
        resetSeen = true
      }

      const rerollOptions = getRandomOptions(rerollPotentialChoices, 3)
      return {
        ...state,
        choicesAvailable: {
          ...state.choicesAvailable,
          [state.stage]: rerollOptions
        },
        choicesSeen: {
          ...state.choicesSeen,
          [state.stage]: resetSeen
            ? [...rerollOptions]
            : [...state.choicesSeen[state.stage], ...rerollOptions]
        }
      }
    case STAGE_ACTIONS.BACK:
      const previousStage = PREVIOUS_STAGE[state.stage]
      const prevChoicesMade = {
        ...state.choicesMade
      }
      delete prevChoicesMade[previousStage]
      const filteredTuples_ = filterTuples(TUPLES, prevChoicesMade)
      const previousState = {
        ...state,
        stage: previousStage,
        choicesMade: prevChoicesMade,
        tuples: filteredTuples_,
        canReroll:
          getUnique(filteredTuples_.map(tuple => tuple[previousStage])).length >
          3
      }

      // Skip place in the backwards direction as well, if there was only one option
      if (
        state.choicesAvailable[previousStage].length === 1 &&
        !previousState.canReroll
      ) {
        return stageReducer(previousState, {
          type: STAGE_ACTIONS.BACK
        })
      } else {
        return previousState
      }
    case STAGE_ACTIONS.RESET:
      return STAGE_INITIAL_STATE
    default:
      return state
  }
}

const App = () => {
  const [stage, dispatch] = useReducer(stageReducer, STAGE_INITIAL_STATE)

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
        {[STAGES.ADJECTIVE, STAGES.NOUN, STAGES.PLACE, STAGES.RESULT].includes(
          stage.stage
        ) && (
          <Button variant='contained' onClick={handleBack}>
            Zurück
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

      {![STAGES.START, STAGES.ADJECTIVE_TYPE, STAGES.ADJECTIVE].includes(
        stage.stage
      ) && (
        <Stack
          direction={'row'}
          gap={'10px'}
          flexWrap={'wrap'}
          justifyContent={'center'}
          className={styles.choicesMade}
        >
          {Object.entries(stage.choicesMade)
            .filter(([stage, choice]) => stage !== STAGES.ADJECTIVE_TYPE)
            .map(([stage, choice]) => (
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

      {[STAGES.ADJECTIVE, STAGES.NOUN, STAGES.PLACE].includes(stage.stage) &&
        stage.canReroll && (
          <Stack
            direction={'row'}
            gap={'10px'}
            flexWrap={'wrap'}
            justifyContent={'center'}
            className={styles.otherChoices}
          >
            <Button variant='contained' onClick={handleReroll}>
              Neue Wörter
            </Button>
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
                    stage.tuples[0].chunks.length > 25 ? 'pre-wrap' : 'nowrap'
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
