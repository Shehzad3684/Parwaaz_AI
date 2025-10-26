
import { Scenario, UnitType } from './types';

export const SCENARIOS: Record<string, Scenario> = {
  tutorial: {
    id: 'tutorial',
    title: 'Welfare Check',
    shift: 0,
    systemInstruction: `You are an elderly woman who is worried about your neighbor. You haven't seen them in a few days. You are concerned but not panicked. Speak calmly and a little slowly. Your goal is to get the operator to send someone to check on your neighbor.`,
    keyInfo: ['Neighbor\'s address', 'How long they have been unseen', 'Reason for concern'],
    requiredActions: [UnitType.POLICE],
  },
  shift1_noise: {
    id: 'shift1_noise',
    title: 'Noise Complaint',
    shift: 1,
    systemInstruction: `You are annoyed by a loud party next door. It's late and you have to work early. You are irritated but not in danger. Your goal is to get the police to shut the party down.`,
    keyInfo: ['Your address', 'Location of party', 'Type of noise'],
    requiredActions: [UnitType.POLICE],
  },
  shift2_cardiac: {
    id: 'shift2_cardiac',
    title: 'Cardiac Arrest',
    shift: 2,
    systemInstruction: `You are panicked. Your spouse has just collapsed and is not breathing. You need to convey the urgency and location immediately. Between panicked breaths, you must listen to the operator's instructions for CPR. Your emotional state is PANIC.`,
    keyInfo: ['Address', 'Patient is not breathing', 'Patient is unconscious'],
    requiredActions: [UnitType.EMS_ALS, UnitType.FIRE],
  },
  shift3_invasion: {
    id: 'shift3_invasion',
    title: 'Home Invasion',
    shift: 3,
    systemInstruction: `You are hiding in a closet, whispering. You can hear intruders in your house. Your emotional state is FEAR. You must stay quiet. Answer questions in short, whispered phrases. The operator's volume will affect your ability to stay hidden. If they are too loud, you have to tell them to be quiet.`,
    keyInfo: ['Address', 'Number of intruders', 'Your location in the house', 'Presence of weapons'],
    requiredActions: [UnitType.SWAT],
  },
  shift4_mci: {
    id: 'shift4_mci',
    title: 'Multi-Car Pile-up',
    shift: 4,
    systemInstruction: `You are a witness to a major multi-car accident on the freeway. You are overwhelmed and trying to describe the chaotic scene. There are multiple injuries. Your emotional state is CONFUSED and SHAKEN. You need to estimate the number of vehicles and injured people.`,
    keyInfo: ['Freeway and nearest exit', 'Approximate number of vehicles', 'Visible injuries/hazards (fire, smoke)'],
    requiredActions: [UnitType.POLICE, UnitType.FIRE, UnitType.EMS_ALS, UnitType.EMS_BLS],
  },
};

export const ALL_SHIFTS: Scenario[][] = [
    [], // shift 0 is tutorial
    [SCENARIOS.shift1_noise],
    [SCENARIOS.shift2_cardiac],
    [SCENARIOS.shift3_invasion],
    [SCENARIOS.shift4_mci],
];
