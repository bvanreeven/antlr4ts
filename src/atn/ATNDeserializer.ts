﻿/*
 * [The "BSD license"]
 *  Copyright (c) 2013 Terence Parr
 *  Copyright (c) 2013 Sam Harwell
 *  All rights reserved.
 *
 *  Redistribution and use in source and binary forms, with or without
 *  modification, are permitted provided that the following conditions
 *  are met:
 *
 *  1. Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 *  2. Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 *  3. The name of the author may not be used to endorse or promote products
 *     derived from this software without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE AUTHOR ``AS IS'' AND ANY EXPRESS OR
 *  IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 *  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT,
 *  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 *  DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 *  THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 *  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 *  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

// ConvertTo-TS run at 2016-10-04T11:26:25.9683447-07:00

import { ActionTransition } from './ActionTransition';
import { Arrays } from '../misc/Arrays';
import { ATN } from './ATN';
import { ATNDeserializationOptions } from './ATNDeserializationOptions';
import { ATNState } from './ATNState';
import { ATNStateType } from './ATNStateType';
import { ATNType } from './ATNType';
import { AtomTransition } from './AtomTransition';
import { BasicBlockStartState } from './BasicBlockStartState';
import { BasicState } from './BasicState';
import { BitSet } from '../misc/BitSet';
import { BlockEndState } from './BlockEndState';
import { BlockStartState } from './BlockStartState';
import { DecisionState } from './DecisionState';
import { DFA } from '../dfa/DFA';
import { EpsilonTransition } from './EpsilonTransition';
import { Interval } from '../misc/Interval';
import { IntervalSet } from '../misc/IntervalSet';
import { InvalidState } from './InvalidState';
import { LexerAction } from './LexerAction';
import { LexerActionType } from './LexerActionType';
import { LexerChannelAction } from './LexerChannelAction';
import { LexerCustomAction } from './LexerCustomAction';
import { LexerModeAction } from './LexerModeAction';
import { LexerMoreAction } from './LexerMoreAction';
import { LexerPopModeAction } from './LexerPopModeAction';
import { LexerPushModeAction } from './LexerPushModeAction';
import { LexerSkipAction } from './LexerSkipAction';
import { LexerTypeAction } from './LexerTypeAction';
import { LoopEndState } from './LoopEndState';
import { NotNull } from '../Decorators';
import { NotSetTransition } from './NotSetTransition';
import { ParserATNSimulator } from './ParserATNSimulator';
import { PlusBlockStartState } from './PlusBlockStartState';
import { PlusLoopbackState } from './PlusLoopbackState';
import { PrecedencePredicateTransition } from './PrecedencePredicateTransition';
import { PredicateTransition } from './PredicateTransition';
import { RangeTransition } from './RangeTransition';
import { RuleStartState } from './RuleStartState';
import { RuleStopState } from './RuleStopState';
import { RuleTransition } from './RuleTransition';
import { SetTransition } from './SetTransition';
import { StarBlockStartState } from './StarBlockStartState';
import { StarLoopbackState } from './StarLoopbackState';
import { StarLoopEntryState } from './StarLoopEntryState';
import { Token } from '../Token';
import { TokensStartState } from './TokensStartState';
import { Transition } from './Transition';
import { TransitionType } from './TransitionType';
import { UUID } from '../misc/UUID';
import { WildcardTransition } from './WildcardTransition';

/**
 *
 * @author Sam Harwell
 */
export class ATNDeserializer {
	static get SERIALIZED_VERSION(): number {
		/* This value should never change. Updates following this version are
		 * reflected as change in the unique ID SERIALIZED_UUID.
		 */
		return 3;
	}

	/* WARNING: DO NOT MERGE THESE LINES. If UUIDs differ during a merge,
	 * resolve the conflict by generating a new ID!
	 */

	/**
	 * This is the earliest supported serialized UUID.
	 */
	private static BASE_SERIALIZED_UUID: UUID = UUID.fromString("E4178468-DF95-44D0-AD87-F22A5D5FB6D3");
	/**
	 * This UUID indicates an extension of {@link #ADDED_PRECEDENCE_TRANSITIONS}
	 * for the addition of lexer actions encoded as a sequence of
	 * {@link LexerAction} instances.
	 */
	private static ADDED_LEXER_ACTIONS: UUID = UUID.fromString("AB35191A-1603-487E-B75A-479B831EAF6D");
	/**
	 * This list contains all of the currently supported UUIDs, ordered by when
	 * the feature first appeared in this branch.
	 */
	private static SUPPORTED_UUIDS: UUID[] = [
		ATNDeserializer.BASE_SERIALIZED_UUID,
		ATNDeserializer.ADDED_LEXER_ACTIONS
	];

	/**
	 * This is the current serialized UUID.
	 */
	private static SERIALIZED_UUID: UUID = ATNDeserializer.ADDED_LEXER_ACTIONS;

	@NotNull
	private deserializationOptions: ATNDeserializationOptions;

	 constructor(deserializationOptions?: ATNDeserializationOptions)  {
		if (deserializationOptions == null) {
			deserializationOptions = ATNDeserializationOptions.getDefaultOptions();
		}

		this.deserializationOptions = deserializationOptions;
	}

	/**
	 * Determines if a particular serialized representation of an ATN supports
	 * a particular feature, identified by the {@link UUID} used for serializing
	 * the ATN at the time the feature was first introduced.
	 *
	 * @param feature The {@link UUID} marking the first time the feature was
	 * supported in the serialized ATN.
	 * @param actualUuid The {@link UUID} of the actual serialized ATN which is
	 * currently being deserialized.
	 * @return {@code true} if the {@code actualUuid} value represents a
	 * serialized ATN at or after the feature identified by {@code feature} was
	 * introduced; otherwise, {@code false}.
	 */
	protected isFeatureSupported(feature: UUID, actualUuid: UUID): boolean {
		let featureIndex: number = Arrays.indexOf(ATNDeserializer.SUPPORTED_UUIDS, feature);
		if (featureIndex < 0) {
			return false;
		}

		return Arrays.indexOf(ATNDeserializer.SUPPORTED_UUIDS, actualUuid) >= featureIndex;
	}

	deserialize(@NotNull data: Uint16Array): ATN {
		data = data.slice(0);
		// don't adjust the first value since that's the version number
		for (let i = 1; i < data.length; i++) {
			data[i] = (data[i] - 2) & 0xFFFF;
		}

		let p: number =  0;
		let version: number = ATNDeserializer.toInt(data[p++]);
		if (version != ATNDeserializer.SERIALIZED_VERSION) {
			let reason = `Could not deserialize ATN with version ${version} (expected ${ATNDeserializer.SERIALIZED_VERSION}).`;
			throw new Error(reason);
		}

		let uuid: UUID = ATNDeserializer.toUUID(data, p);
		p += 8;
		if (Arrays.indexOf(ATNDeserializer.SUPPORTED_UUIDS, uuid) >= 0) {
			let reason = `Could not deserialize ATN with UUID ${uuid} (expected ${ATNDeserializer.SERIALIZED_UUID} or a legacy UUID).`;
			throw new Error(reason);
		}

		let supportsLexerActions: boolean = this.isFeatureSupported(ATNDeserializer.ADDED_LEXER_ACTIONS, uuid);

		let grammarType: ATNType =  ATNDeserializer.toInt(data[p++]);
		let maxTokenType: number =  ATNDeserializer.toInt(data[p++]);
		let atn: ATN =  new ATN(grammarType, maxTokenType);

		//
		// STATES
		//
		let loopBackStateNumbers: [ LoopEndState, number ][] = [];
		let endStateNumbers: [ BlockStartState, number ][] = [];
		let nstates: number = ATNDeserializer.toInt(data[p++]);
		for (let i=0; i<nstates; i++) {
			let stype: ATNStateType = ATNDeserializer.toInt(data[p++]);
			// ignore bad type of states
			if ( stype===ATNStateType.INVALID_TYPE ) {
				atn.addState(new InvalidState());
				continue;
			}

			let ruleIndex: number =  ATNDeserializer.toInt(data[p++]);
			if (ruleIndex === 0xFFFF) {
				ruleIndex = -1;
			}

			let s: ATNState =  this.stateFactory(stype, ruleIndex);
			if ( stype === ATNStateType.LOOP_END ) { // special case
				let loopBackStateNumber: number = ATNDeserializer.toInt(data[p++]);
				loopBackStateNumbers.push([ <LoopEndState>s, loopBackStateNumber ]);
			}
			else if (s instanceof BlockStartState) {
				let endStateNumber: number = ATNDeserializer.toInt(data[p++]);
				endStateNumbers.push([ s, endStateNumber ]);
			}
			atn.addState(s);
		}

		// delay the assignment of loop back and end states until we know all the state instances have been initialized
		for (let pair of loopBackStateNumbers) {
			pair[0].loopBackState = atn.states[pair[1]];
		}

		for (let pair of endStateNumbers) {
			pair[0].endState = <BlockEndState>atn.states[pair[1]];
		}

		let numNonGreedyStates: number = ATNDeserializer.toInt(data[p++]);
		for (let i = 0; i < numNonGreedyStates; i++) {
			let stateNumber: number = ATNDeserializer. toInt(data[p++]);
			(<DecisionState>atn.states[stateNumber]).nonGreedy = true;
		}

		let numSllDecisions: number = ATNDeserializer.toInt(data[p++]);
		for (let i = 0; i < numSllDecisions; i++) {
			let stateNumber: number = ATNDeserializer. toInt(data[p++]);
			(<DecisionState>atn.states[stateNumber]).sll = true;
		}

		let numPrecedenceStates: number = ATNDeserializer.toInt(data[p++]);
		for (let i = 0; i < numPrecedenceStates; i++) {
			let stateNumber: number = ATNDeserializer. toInt(data[p++]);
			(<RuleStartState>atn.states[stateNumber]).isPrecedenceRule = true;
		}

		//
		// RULES
		//
		let nrules: number = ATNDeserializer.toInt(data[p++]);
		if ( atn.grammarType === ATNType.LEXER ) {
			atn.ruleToTokenType = new Array<number>(nrules);
		}

		atn.ruleToStartState = new Array<RuleStartState>(nrules);
		for (let i=0; i<nrules; i++) {
			let s: number = ATNDeserializer.toInt(data[p++]);
			let startState: RuleStartState =  <RuleStartState>atn.states[s];
			startState.leftFactored = ATNDeserializer.toInt(data[p++]) != 0;
			atn.ruleToStartState[i] = startState;
			if ( atn.grammarType === ATNType.LEXER ) {
				let tokenType: number = ATNDeserializer.toInt(data[p++]);
				if (tokenType === 0xFFFF) {
					tokenType = Token.EOF;
				}

				atn.ruleToTokenType[i] = tokenType;

				if (!this.isFeatureSupported(ATNDeserializer.ADDED_LEXER_ACTIONS, uuid)) {
					// this piece of unused metadata was serialized prior to the
					// addition of LexerAction
					let actionIndexIgnored: number =  ATNDeserializer.toInt(data[p++]);
					if (actionIndexIgnored === 0xFFFF) {
						actionIndexIgnored = -1;
					}
				}
			}
		}

		atn.ruleToStopState = new Array<RuleStopState>(nrules);
		for (let state of atn.states) {
			if (!(state instanceof RuleStopState)) {
				continue;
			}

			atn.ruleToStopState[state.ruleIndex] = state;
			atn.ruleToStartState[state.ruleIndex].stopState = state;
		}

		//
		// MODES
		//
		let nmodes: number =  ATNDeserializer.toInt(data[p++]);
		for (let i=0; i<nmodes; i++) {
			let s: number = ATNDeserializer.toInt(data[p++]);
			atn.modeToStartState.push(<TokensStartState>atn.states[s]);
		}

		atn.modeToDFA = new Array<DFA>(nmodes);
		for (let i = 0; i < nmodes; i++) {
			atn.modeToDFA[i] = new DFA(atn.modeToStartState[i]);
		}

		//
		// SETS
		//
		let sets: IntervalSet[] = [];
		let nsets: number =  ATNDeserializer.toInt(data[p++]);
		for (let i=0; i<nsets; i++) {
			let nintervals: number =  ATNDeserializer.toInt(data[p]);
			p++;
			let set: IntervalSet =  new IntervalSet();
			sets.push(set);

			let containsEof: boolean =  ATNDeserializer.toInt(data[p++]) != 0;
			if (containsEof) {
				set.add(-1);
			}

			for (let j=0; j<nintervals; j++) {
				set.add(ATNDeserializer.toInt(data[p]), ATNDeserializer.toInt(data[p + 1]));
				p += 2;
			}
		}

		//
		// EDGES
		//
		let nedges: number =  ATNDeserializer.toInt(data[p++]);
		for (let i=0; i<nedges; i++) {
			let src: number =  ATNDeserializer.toInt(data[p]);
			let trg: number =  ATNDeserializer.toInt(data[p+1]);
			let ttype: number =  ATNDeserializer.toInt(data[p+2]);
			let arg1: number =  ATNDeserializer.toInt(data[p+3]);
			let arg2: number =  ATNDeserializer.toInt(data[p+4]);
			let arg3: number =  ATNDeserializer.toInt(data[p+5]);
			let trans: Transition =  this.edgeFactory(atn, ttype, src, trg, arg1, arg2, arg3, sets);
//			System.out.println("EDGE "+trans.getClass().getSimpleName()+" "+
//							   src+"->"+trg+
//					   " "+Transition.serializationNames[ttype]+
//					   " "+arg1+","+arg2+","+arg3);
			let srcState: ATNState =  atn.states[src];
			srcState.addTransition(trans);
			p += 6;
		}

		// edges for rule stop states can be derived, so they aren't serialized
		for (let state of atn.states) {
			let returningToLeftFactored: boolean =  state.ruleIndex >= 0 && atn.ruleToStartState[state.ruleIndex].leftFactored;
			for (let i = 0; i < state.getNumberOfTransitions(); i++) {
				let t: Transition =  state.transition(i);
				if (!(t instanceof RuleTransition)) {
					continue;
				}

				let ruleTransition: RuleTransition =  t;
				let returningFromLeftFactored: boolean =  atn.ruleToStartState[ruleTransition.target.ruleIndex].leftFactored;
				if (!returningFromLeftFactored && returningToLeftFactored) {
					continue;
				}

				let outermostPrecedenceReturn: number =  -1;
				if (atn.ruleToStartState[ruleTransition.target.ruleIndex].isPrecedenceRule) {
					if (ruleTransition.precedence === 0) {
						outermostPrecedenceReturn = ruleTransition.target.ruleIndex;
					}
				}

				let returnTransition: EpsilonTransition =  new EpsilonTransition(ruleTransition.followState, outermostPrecedenceReturn);
				atn.ruleToStopState[ruleTransition.target.ruleIndex].addTransition(returnTransition);
			}
		}

		for (let state of atn.states) {
			if (state instanceof BlockStartState) {
				// we need to know the end state to set its start state
				if (state.endState == null) {
					throw new Error("IllegalStateException");
				}

				// block end states can only be associated to a single block start state
				if (state.endState.startState != null) {
					throw new Error("IllegalStateException");
				}

				state.endState.startState = state;
			}

			if (state instanceof PlusLoopbackState) {
				let loopbackState: PlusLoopbackState = state;
				for (let i = 0; i < loopbackState.getNumberOfTransitions(); i++) {
					let target: ATNState =  loopbackState.transition(i).target;
					if (target instanceof PlusBlockStartState) {
						target.loopBackState = loopbackState;
					}
				}
			}
			else if (state instanceof StarLoopbackState) {
				let loopbackState: StarLoopbackState = state;
				for (let i = 0; i < loopbackState.getNumberOfTransitions(); i++) {
					let target: ATNState =  loopbackState.transition(i).target;
					if (target instanceof StarLoopEntryState) {
						target.loopBackState = loopbackState;
					}
				}
			}
		}

		//
		// DECISIONS
		//
		let ndecisions: number =  ATNDeserializer.toInt(data[p++]);
		for (let i=1; i<=ndecisions; i++) {
			let s: number =  ATNDeserializer.toInt(data[p++]);
			let decState: DecisionState =  <DecisionState>atn.states[s];
			atn.decisionToState.push(decState);
			decState.decision = i-1;
		}

		//
		// LEXER ACTIONS
		//
		if (atn.grammarType === ATNType.LEXER) {
			if (supportsLexerActions) {
				atn.lexerActions = new Array<LexerAction>(ATNDeserializer.toInt(data[p++]));
				for (let i = 0; i < atn.lexerActions.length; i++) {
					let actionType: LexerActionType =  ATNDeserializer.toInt(data[p++]);
					let data1: number =  ATNDeserializer.toInt(data[p++]);
					if (data1 == 0xFFFF) {
						data1 = -1;
					}

					let data2: number =  ATNDeserializer.toInt(data[p++]);
					if (data2 == 0xFFFF) {
						data2 = -1;
					}

					let lexerAction: LexerAction =  this.lexerActionFactory(actionType, data1, data2);

					atn.lexerActions[i] = lexerAction;
				}
			}
			else {
				// for compatibility with older serialized ATNs, convert the old
				// serialized action index for action transitions to the new
				// form, which is the index of a LexerCustomAction
				let legacyLexerActions: LexerAction[] = [];
				for (let state of atn.states) {
					for (let i = 0; i < state.getNumberOfTransitions(); i++) {
						let transition: Transition =  state.transition(i);
						if (!(transition instanceof ActionTransition)) {
							continue;
						}

						let ruleIndex: number =  transition.ruleIndex;
						let actionIndex: number =  transition.actionIndex;
						let lexerAction: LexerCustomAction =  new LexerCustomAction(ruleIndex, actionIndex);
						state.setTransition(i, new ActionTransition(transition.target, ruleIndex, legacyLexerActions.length, false));
						legacyLexerActions.push(lexerAction);
					}
				}

				atn.lexerActions = legacyLexerActions;
			}
		}

		this.markPrecedenceDecisions(atn);

		atn.decisionToDFA = new Array<DFA>(ndecisions);
		for (let i = 0; i < ndecisions; i++) {
			atn.decisionToDFA[i] = new DFA(atn.decisionToState[i], i);
		}

		if (this.deserializationOptions.isVerifyATN()) {
			this.verifyATN(atn);
		}

		if (this.deserializationOptions.isGenerateRuleBypassTransitions() && atn.grammarType === ATNType.PARSER) {
			atn.ruleToTokenType = new Array<number>(atn.ruleToStartState.length);
			for (let i = 0; i < atn.ruleToStartState.length; i++) {
				atn.ruleToTokenType[i] = atn.maxTokenType + i + 1;
			}

			for (let i = 0; i < atn.ruleToStartState.length; i++) {
				let bypassStart: BasicBlockStartState =  new BasicBlockStartState();
				bypassStart.ruleIndex = i;
				atn.addState(bypassStart);

				let bypassStop: BlockEndState =  new BlockEndState();
				bypassStop.ruleIndex = i;
				atn.addState(bypassStop);

				bypassStart.endState = bypassStop;
				atn.defineDecisionState(bypassStart);

				bypassStop.startState = bypassStart;

				let endState: ATNState | undefined;
				let excludeTransition: Transition | undefined;
				if (atn.ruleToStartState[i].isPrecedenceRule) {
					// wrap from the beginning of the rule to the StarLoopEntryState
					endState = undefined;
					for (let state of atn.states) {
						if (state.ruleIndex !== i) {
							continue;
						}

						if (!(state instanceof StarLoopEntryState)) {
							continue;
						}

						let maybeLoopEndState: ATNState =  state.transition(state.getNumberOfTransitions() - 1).target;
						if (!(maybeLoopEndState instanceof LoopEndState)) {
							continue;
						}

						if (maybeLoopEndState.epsilonOnlyTransitions && maybeLoopEndState.transition(0).target instanceof RuleStopState) {
							endState = state;
							break;
						}
					}

					if (!endState) {
						throw new Error("Couldn't identify final state of the precedence rule prefix section.");
					}

					excludeTransition = (<StarLoopEntryState>endState).loopBackState.transition(0);
				}
				else {
					endState = atn.ruleToStopState[i];
				}

				// all non-excluded transitions that currently target end state need to target blockEnd instead
				for (let state of atn.states) {
					for (let i = 0; i < state.getNumberOfTransitions(); i++) {
						let transition = state.transition(i);
						if (transition === excludeTransition) {
							continue;
						}

						if (transition.target === endState) {
							transition.target = bypassStop;
						}
					}
				}

				// all transitions leaving the rule start state need to leave blockStart instead
				while (atn.ruleToStartState[i].getNumberOfTransitions() > 0) {
					let transition: Transition =  atn.ruleToStartState[i].removeTransition(atn.ruleToStartState[i].getNumberOfTransitions() - 1);
					bypassStart.addTransition(transition);
				}

				// link the new states
				atn.ruleToStartState[i].addTransition(new EpsilonTransition(bypassStart));
				bypassStop.addTransition(new EpsilonTransition(endState));

				let matchState: ATNState =  new BasicState();
				atn.addState(matchState);
				matchState.addTransition(new AtomTransition(bypassStop, atn.ruleToTokenType[i]));
				bypassStart.addTransition(new EpsilonTransition(matchState));
			}

			if (this.deserializationOptions.isVerifyATN()) {
				// reverify after modification
				this.verifyATN(atn);
			}
		}

		if (this.deserializationOptions.isOptimize()) {
			while (true) {
				let optimizationCount: number =  0;
				optimizationCount += ATNDeserializer.inlineSetRules(atn);
				optimizationCount += ATNDeserializer.combineChainedEpsilons(atn);
				let preserveOrder: boolean =  atn.grammarType === ATNType.LEXER;
				optimizationCount += ATNDeserializer.optimizeSets(atn, preserveOrder);
				if (optimizationCount === 0) {
					break;
				}
			}

			if (this.deserializationOptions.isVerifyATN()) {
				// reverify after modification
				this.verifyATN(atn);
			}
		}

		ATNDeserializer.identifyTailCalls(atn);

		return atn;
	}

	/**
	 * Analyze the {@link StarLoopEntryState} states in the specified ATN to set
	 * the {@link StarLoopEntryState#precedenceRuleDecision} field to the
	 * correct value.
	 *
	 * @param atn The ATN.
	 */
	protected markPrecedenceDecisions(@NotNull atn: ATN): void {
		for (let state of atn.states) {
			if (!(state instanceof StarLoopEntryState)) {
				continue;
			}

			/* We analyze the ATN to determine if this ATN decision state is the
			 * decision for the closure block that determines whether a
			 * precedence rule should continue or complete.
			 */
			if (atn.ruleToStartState[state.ruleIndex].isPrecedenceRule) {
				let maybeLoopEndState: ATNState =  state.transition(state.getNumberOfTransitions() - 1).target;
				if (maybeLoopEndState instanceof LoopEndState) {
					if (maybeLoopEndState.epsilonOnlyTransitions && maybeLoopEndState.transition(0).target instanceof RuleStopState) {
						state.precedenceRuleDecision = true;
					}
				}
			}
		}
	}

	protected verifyATN(atn: ATN): void {
		// verify assumptions
		for (let state of atn.states) {
			this.checkCondition(state != null, "ATN states should not be null.");
			if (state.getStateType() === ATNStateType.INVALID_TYPE) {
				continue;
			}

			this.checkCondition(state.onlyHasEpsilonTransitions() || state.getNumberOfTransitions() <= 1);

			if (state instanceof PlusBlockStartState) {
				this.checkCondition(state.loopBackState != null);
			}

			if (state instanceof StarLoopEntryState) {
				let starLoopEntryState: StarLoopEntryState =  state;
				this.checkCondition(starLoopEntryState.loopBackState != null);
				this.checkCondition(starLoopEntryState.getNumberOfTransitions() === 2);

				if (starLoopEntryState.transition(0).target instanceof StarBlockStartState) {
					this.checkCondition(starLoopEntryState.transition(1).target instanceof LoopEndState);
					this.checkCondition(!starLoopEntryState.nonGreedy);
				}
				else if (starLoopEntryState.transition(0).target instanceof LoopEndState) {
					this.checkCondition(starLoopEntryState.transition(1).target instanceof StarBlockStartState);
					this.checkCondition(starLoopEntryState.nonGreedy);
				}
				else {
					throw new Error("IllegalStateException");
				}
			}

			if (state instanceof StarLoopbackState) {
				this.checkCondition(state.getNumberOfTransitions() === 1);
				this.checkCondition(state.transition(0).target instanceof StarLoopEntryState);
			}

			if (state instanceof LoopEndState) {
				this.checkCondition(state.loopBackState != null);
			}

			if (state instanceof RuleStartState) {
				this.checkCondition(state.stopState != null);
			}

			if (state instanceof BlockStartState) {
				this.checkCondition(state.endState != null);
			}

			if (state instanceof BlockEndState) {
				this.checkCondition(state.startState != null);
			}

			if (state instanceof DecisionState) {
				let decisionState: DecisionState =  state;
				this.checkCondition(decisionState.getNumberOfTransitions() <= 1 || decisionState.decision >= 0);
			}
			else {
				this.checkCondition(state.getNumberOfTransitions() <= 1 || state instanceof RuleStopState);
			}
		}
	}

	protected checkCondition(condition: boolean, message?: string): void {
		if (!condition) {
			throw new Error("IllegalStateException: " + message);
		}
	}

	private static inlineSetRules(atn: ATN): number {
		let inlinedCalls: number =  0;

		let ruleToInlineTransition: Transition[] =  new Array<Transition>(atn.ruleToStartState.length);
		for (let i = 0; i < atn.ruleToStartState.length; i++) {
			let startState: RuleStartState =  atn.ruleToStartState[i];
			let middleState: ATNState =  startState;
			while (middleState.onlyHasEpsilonTransitions()
				&& middleState.getNumberOfOptimizedTransitions() === 1
				&& middleState.getOptimizedTransition(0).getSerializationType() === TransitionType.EPSILON)
			{
				middleState = middleState.getOptimizedTransition(0).target;
			}

			if (middleState.getNumberOfOptimizedTransitions() !== 1) {
				continue;
			}

			let matchTransition: Transition =  middleState.getOptimizedTransition(0);
			let matchTarget: ATNState =  matchTransition.target;
			if (matchTransition.isEpsilon()
				|| !matchTarget.onlyHasEpsilonTransitions()
				|| matchTarget.getNumberOfOptimizedTransitions() !== 1
				|| !(matchTarget.getOptimizedTransition(0).target instanceof RuleStopState))
			{
				continue;
			}

			switch (matchTransition.getSerializationType()) {
			case TransitionType.ATOM:
			case TransitionType.RANGE:
			case TransitionType.SET:
				ruleToInlineTransition[i] = matchTransition;
				break;

			case TransitionType.NOT_SET:
			case TransitionType.WILDCARD:
				// not implemented yet
				continue;

			default:
				continue;
			}
		}

		for (let stateNumber = 0; stateNumber < atn.states.length; stateNumber++) {
			let state: ATNState =  atn.states[stateNumber];
			if (state.ruleIndex < 0) {
				continue;
			}

			let optimizedTransitions: Transition[] | undefined;
			for (let i = 0; i < state.getNumberOfOptimizedTransitions(); i++) {
				let transition: Transition =  state.getOptimizedTransition(i);
				if (!(transition instanceof RuleTransition)) {
					if (optimizedTransitions != null) {
						optimizedTransitions.push(transition);
					}

					continue;
				}

				let ruleTransition: RuleTransition =  transition;
				let effective: Transition =  ruleToInlineTransition[ruleTransition.target.ruleIndex];
				if (effective == null) {
					if (optimizedTransitions != null) {
						optimizedTransitions.push(transition);
					}

					continue;
				}

				if (optimizedTransitions == null) {
					optimizedTransitions = [];
					for (let j = 0; j < i; j++) {
						optimizedTransitions.push(state.getOptimizedTransition(i));
					}
				}

				inlinedCalls++;
				let target: ATNState =  ruleTransition.followState;
				let intermediateState: ATNState =  new BasicState();
				intermediateState.setRuleIndex(target.ruleIndex);
				atn.addState(intermediateState);
				optimizedTransitions.push(new EpsilonTransition(intermediateState));

				switch (effective.getSerializationType()) {
				case TransitionType.ATOM:
					intermediateState.addTransition(new AtomTransition(target, (<AtomTransition>effective)._label));
					break;

				case TransitionType.RANGE:
					intermediateState.addTransition(new RangeTransition(target, (<RangeTransition>effective).from, (<RangeTransition>effective).to));
					break;

				case TransitionType.SET:
					intermediateState.addTransition(new SetTransition(target, (<SetTransition>effective).label()));
					break;

				default:
					throw new Error("UnsupportedOperationException");
				}
			}

			if (optimizedTransitions != null) {
				if (state.isOptimized()) {
					while (state.getNumberOfOptimizedTransitions() > 0) {
						state.removeOptimizedTransition(state.getNumberOfOptimizedTransitions() - 1);
					}
				}

				for (let transition of optimizedTransitions) {
					state.addOptimizedTransition(transition);
				}
			}
		}

		if (ParserATNSimulator.debug) {
			console.log("ATN runtime optimizer removed " + inlinedCalls + " rule invocations by inlining sets.");
		}

		return inlinedCalls;
	}

	private static combineChainedEpsilons(atn: ATN): number {
		let removedEdges: number =  0;

		for (let state of atn.states) {
			if (!state.onlyHasEpsilonTransitions() || state instanceof RuleStopState) {
				continue;
			}

			let optimizedTransitions: Transition[] | undefined;
			nextTransition:
			for (let i = 0; i < state.getNumberOfOptimizedTransitions(); i++) {
				let transition: Transition =  state.getOptimizedTransition(i);
				let intermediate: ATNState =  transition.target;
				if (transition.getSerializationType() !== TransitionType.EPSILON
					|| (<EpsilonTransition>transition).outermostPrecedenceReturn() !== -1
					|| intermediate.getStateType() !== ATNStateType.BASIC
					|| !intermediate.onlyHasEpsilonTransitions())
				{
					if (optimizedTransitions != null) {
						optimizedTransitions.push(transition);
					}

					continue nextTransition;
				}

				for (let j = 0; j < intermediate.getNumberOfOptimizedTransitions(); j++) {
					if (intermediate.getOptimizedTransition(j).getSerializationType() !== TransitionType.EPSILON
						|| (<EpsilonTransition>intermediate.getOptimizedTransition(j)).outermostPrecedenceReturn() !== -1)
					{
						if (optimizedTransitions != null) {
							optimizedTransitions.push(transition);
						}

						continue nextTransition;
					}
				}

				removedEdges++;
				if (optimizedTransitions == null) {
					optimizedTransitions = [];
					for (let j = 0; j < i; j++) {
						optimizedTransitions.push(state.getOptimizedTransition(j));
					}
				}

				for (let j = 0; j < intermediate.getNumberOfOptimizedTransitions(); j++) {
					let target: ATNState =  intermediate.getOptimizedTransition(j).target;
					optimizedTransitions.push(new EpsilonTransition(target));
				}
			}

			if (optimizedTransitions != null) {
				if (state.isOptimized()) {
					while (state.getNumberOfOptimizedTransitions() > 0) {
						state.removeOptimizedTransition(state.getNumberOfOptimizedTransitions() - 1);
					}
				}

				for (let transition of optimizedTransitions) {
					state.addOptimizedTransition(transition);
				}
			}
		}

		if (ParserATNSimulator.debug) {
			console.log("ATN runtime optimizer removed " + removedEdges + " transitions by combining chained epsilon transitions.");
		}

		return removedEdges;
	}

	private static optimizeSets(atn: ATN, preserveOrder: boolean): number {
		if (preserveOrder) {
			// this optimization currently doesn't preserve edge order.
			return 0;
		}

		let removedPaths: number =  0;
		let decisions: DecisionState[] =  atn.decisionToState;
		for (let decision of decisions) {
			let setTransitions: IntervalSet =  new IntervalSet();
			for (let i = 0; i < decision.getNumberOfOptimizedTransitions(); i++) {
				let epsTransition: Transition =  decision.getOptimizedTransition(i);
				if (!(epsTransition instanceof EpsilonTransition)) {
					continue;
				}

				if (epsTransition.target.getNumberOfOptimizedTransitions() !== 1) {
					continue;
				}

				let transition: Transition =  epsTransition.target.getOptimizedTransition(0);
				if (!(transition.target instanceof BlockEndState)) {
					continue;
				}

				if (transition instanceof NotSetTransition) {
					// TODO: not yet implemented
					continue;
				}

				if (transition instanceof AtomTransition
					|| transition instanceof RangeTransition
					|| transition instanceof SetTransition)
				{
					setTransitions.add(i);
				}
			}

			if (setTransitions.size() <= 1) {
				continue;
			}

			let optimizedTransitions: Transition[] = [];
			for (let i = 0; i < decision.getNumberOfOptimizedTransitions(); i++) {
				if (!setTransitions.contains(i)) {
					optimizedTransitions.push(decision.getOptimizedTransition(i));
				}
			}

			let blockEndState: ATNState =  decision.getOptimizedTransition(setTransitions.getMinElement()).target.getOptimizedTransition(0).target;
			let matchSet: IntervalSet =  new IntervalSet();
			for (let i = 0; i < setTransitions.getIntervals().length; i++) {
				let interval: Interval =  setTransitions.getIntervals()[i];
				for (let j = interval.a; j <= interval.b; j++) {
					let matchTransition: Transition =  decision.getOptimizedTransition(j).target.getOptimizedTransition(0);
					if (matchTransition instanceof NotSetTransition) {
						throw new Error("Not yet implemented.");
					} else {
						matchSet.addAll(<IntervalSet>matchTransition.label());
					}
				}
			}

			let newTransition: Transition;
			if (matchSet.getIntervals().length === 1) {
				if (matchSet.size() === 1) {
					newTransition = new AtomTransition(blockEndState, matchSet.getMinElement());
				} else {
					let matchInterval: Interval =  matchSet.getIntervals()[0];
					newTransition = new RangeTransition(blockEndState, matchInterval.a, matchInterval.b);
				}
			} else {
				newTransition = new SetTransition(blockEndState, matchSet);
			}

			let setOptimizedState: ATNState =  new BasicState();
			setOptimizedState.setRuleIndex(decision.ruleIndex);
			atn.addState(setOptimizedState);

			setOptimizedState.addTransition(newTransition);
			optimizedTransitions.push(new EpsilonTransition(setOptimizedState));

			removedPaths += decision.getNumberOfOptimizedTransitions() - optimizedTransitions.length;

			if (decision.isOptimized()) {
				while (decision.getNumberOfOptimizedTransitions() > 0) {
					decision.removeOptimizedTransition(decision.getNumberOfOptimizedTransitions() - 1);
				}
			}

			for (let transition of optimizedTransitions) {
				decision.addOptimizedTransition(transition);
			}
		}

		if (ParserATNSimulator.debug) {
			console.log("ATN runtime optimizer removed " + removedPaths + " paths by collapsing sets.");
		}

		return removedPaths;
	}

	private static identifyTailCalls(atn: ATN): void {
		for (let state of atn.states) {
			for (let i = 0; i < state.getNumberOfTransitions(); i++) {
				let transition = state.transition(i);
				if (!(transition instanceof RuleTransition)) {
					continue;
				}

				transition.tailCall = this.testTailCall(atn, transition, false);
				transition.optimizedTailCall = this.testTailCall(atn, transition, true);
			}

			if (!state.isOptimized()) {
				continue;
			}

			for (let i = 0; i < state.getNumberOfOptimizedTransitions(); i++) {
				let transition = state.getOptimizedTransition(i);
				if (!(transition instanceof RuleTransition)) {
					continue;
				}

				transition.tailCall = this.testTailCall(atn, transition, false);
				transition.optimizedTailCall = this.testTailCall(atn, transition, true);
			}
		}
	}

	private static testTailCall(atn: ATN, transition: RuleTransition, optimizedPath: boolean): boolean {
		if (!optimizedPath && transition.tailCall) {
			return true;
		}
		if (optimizedPath && transition.optimizedTailCall) {
			return true;
		}

		let reachable: BitSet =  new BitSet(atn.states.length);
		let worklist: ATNState[] = [];
		worklist.push(transition.followState);
		while (true) {
			let state = worklist.pop();
			if (!state) {
				break;
			}

			if (reachable.get(state.stateNumber)) {
				continue;
			}

			if (state instanceof RuleStopState) {
				continue;
			}

			if (!state.onlyHasEpsilonTransitions()) {
				return false;
			}

			let transitionCount = optimizedPath ? state.getNumberOfOptimizedTransitions() : state.getNumberOfTransitions();
			for (let i = 0; i < transitionCount; i++) {
				let t = optimizedPath ? state.getOptimizedTransition(i) : state.transition(i);
				if (t.getSerializationType() !== TransitionType.EPSILON) {
					return false;
				}

				worklist.push(t.target);
			}
		}

		return true;
	}

	protected static toInt(c: number): number {
		return c;
	}

	protected static toInt32(data: Uint16Array, offset: number): number {
		return data[offset] | (data[offset + 1] << 16);
	}

	protected static toUUID(data: Uint16Array, offset: number): UUID {
		let leastSigBits: number = ATNDeserializer.toInt32(data, offset);
		let lessSigBits: number = ATNDeserializer.toInt32(data, offset + 2);
		let moreSigBits: number = ATNDeserializer.toInt32(data, offset + 4);
		let mostSigBits: number = ATNDeserializer.toInt32(data, offset + 6);
		return new UUID(mostSigBits, moreSigBits, lessSigBits, leastSigBits);
	}

	@NotNull
	protected edgeFactory(@NotNull atn: ATN,
										 type: TransitionType, src: number, trg: number,
										 arg1: number, arg2: number, arg3: number,
										 sets: IntervalSet[]): Transition
	{
		let target: ATNState =  atn.states[trg];
		switch (type) {
			case TransitionType.EPSILON : return new EpsilonTransition(target);
			case TransitionType.RANGE :
				if (arg3 !== 0) {
					return new RangeTransition(target, Token.EOF, arg2);
				}
				else {
					return new RangeTransition(target, arg1, arg2);
				}
			case TransitionType.RULE :
				let rt: RuleTransition =  new RuleTransition(<RuleStartState>atn.states[arg1], arg2, arg3, target);
				return rt;
			case TransitionType.PREDICATE :
				let pt: PredicateTransition =  new PredicateTransition(target, arg1, arg2, arg3 !== 0);
				return pt;
			case TransitionType.PRECEDENCE:
				return new PrecedencePredicateTransition(target, arg1);
			case TransitionType.ATOM :
				if (arg3 !== 0) {
					return new AtomTransition(target, Token.EOF);
				}
				else {
					return new AtomTransition(target, arg1);
				}
			case TransitionType.ACTION :
				let a: ActionTransition =  new ActionTransition(target, arg1, arg2, arg3 !== 0);
				return a;
			case TransitionType.SET : return new SetTransition(target, sets[arg1]);
			case TransitionType.NOT_SET : return new NotSetTransition(target, sets[arg1]);
			case TransitionType.WILDCARD : return new WildcardTransition(target);
		}

		throw new Error("The specified transition type is not valid.");
	}

	protected stateFactory(type: ATNStateType, ruleIndex: number): ATNState {
		let s: ATNState;
		switch (type) {
			case ATNStateType.INVALID_TYPE: return new InvalidState();
			case ATNStateType.BASIC : s = new BasicState(); break;
			case ATNStateType.RULE_START : s = new RuleStartState(); break;
			case ATNStateType.BLOCK_START : s = new BasicBlockStartState(); break;
			case ATNStateType.PLUS_BLOCK_START : s = new PlusBlockStartState(); break;
			case ATNStateType.STAR_BLOCK_START : s = new StarBlockStartState(); break;
			case ATNStateType.TOKEN_START : s = new TokensStartState(); break;
			case ATNStateType.RULE_STOP : s = new RuleStopState(); break;
			case ATNStateType.BLOCK_END : s = new BlockEndState(); break;
			case ATNStateType.STAR_LOOP_BACK : s = new StarLoopbackState(); break;
			case ATNStateType.STAR_LOOP_ENTRY : s = new StarLoopEntryState(); break;
			case ATNStateType.PLUS_LOOP_BACK : s = new PlusLoopbackState(); break;
			case ATNStateType.LOOP_END : s = new LoopEndState(); break;
			default :
				let message: string =  `The specified state type ${type} is not valid.`;
				throw new Error(message);
		}

		s.ruleIndex = ruleIndex;
		return s;
	}

	protected lexerActionFactory(type: LexerActionType, data1: number, data2: number): LexerAction {
		switch (type) {
		case LexerActionType.CHANNEL:
			return new LexerChannelAction(data1);

		case LexerActionType.CUSTOM:
			return new LexerCustomAction(data1, data2);

		case LexerActionType.MODE:
			return new LexerModeAction(data1);

		case LexerActionType.MORE:
			return LexerMoreAction.INSTANCE;

		case LexerActionType.POP_MODE:
			return LexerPopModeAction.INSTANCE;

		case LexerActionType.PUSH_MODE:
			return new LexerPushModeAction(data1);

		case LexerActionType.SKIP:
			return LexerSkipAction.INSTANCE;

		case LexerActionType.TYPE:
			return new LexerTypeAction(data1);

		default:
			let message: string =  `The specified lexer action type ${type} is not valid.`;
			throw new Error(message);
		}
	}
}