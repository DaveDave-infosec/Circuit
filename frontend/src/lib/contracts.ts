import { readContract, writeContract } from "./genlayer";

// --- deployed Circuit contracts (GenLayer Studio, chainId 61999) ---
export const EXECUTOR_ADDRESS = "0xd8d0A423992D90fc2521B846d5ED83C1294B280b";
export const GATE_ADDRESS = "0x78A9C3FaFbF44fF56D6b6a3dCC008b08Fea9DDC3";

// ---------- token ----------
export async function mint(toAddress: string, amount: number) {
  return writeContract(EXECUTOR_ADDRESS, "mint", [toAddress, amount]);
}

export async function balanceOf(address: string): Promise<number> {
  return Number(await readContract(EXECUTOR_ADDRESS, "balance_of", [address]));
}

// ---------- executor config & state ----------
export async function getConfig(): Promise<any> {
  return await readContract(EXECUTOR_ADDRESS, "get_config", []);
}

export async function getTreasuryState(): Promise<any> {
  return await readContract(EXECUTOR_ADDRESS, "get_treasury_state", []);
}

export async function getConstitution(): Promise<any> {
  return await readContract(EXECUTOR_ADDRESS, "get_constitution", []);
}

export async function isApprovedDestination(dest: string): Promise<boolean> {
  return (await readContract(EXECUTOR_ADDRESS, "is_approved_destination", [dest])) as boolean;
}

// ---------- executor setup (owner) ----------
export async function fundTreasury(caller: string, targetName: string, amount: number) {
  return writeContract(EXECUTOR_ADDRESS, "fund_treasury", [caller, targetName, amount]);
}

export async function setConstitution(
  caller: string,
  maxTransferBps: number,
  paramFeeCapBps: number,
  initialParamFeeBps: number
) {
  return writeContract(EXECUTOR_ADDRESS, "set_constitution", [
    caller,
    maxTransferBps,
    paramFeeCapBps,
    initialParamFeeBps,
  ]);
}

export async function addApprovedDestination(caller: string, dest: string) {
  return writeContract(EXECUTOR_ADDRESS, "add_approved_destination", [caller, dest]);
}

export async function lockConstitution(caller: string) {
  return writeContract(EXECUTOR_ADDRESS, "lock_constitution", [caller]);
}

// ---------- actions ----------
export async function proposeAction(
  caller: string,
  submittedAt: string,
  kind: string,
  recipient: string,
  amount: number,
  paramName: string,
  paramValue: number,
  proposalUrl: string
) {
  return writeContract(EXECUTOR_ADDRESS, "propose_action", [
    caller,
    submittedAt,
    kind,
    recipient,
    amount,
    paramName,
    paramValue,
    proposalUrl,
  ]);
}

export async function applyVerdict(
  caller: string,
  actionId: string,
  caseId: string,
  outcome: string,
  reason: string
) {
  return writeContract(EXECUTOR_ADDRESS, "apply_verdict", [caller, actionId, caseId, outcome, reason]);
}

export async function clearDelay(caller: string, actionId: string) {
  return writeContract(EXECUTOR_ADDRESS, "clear_delay", [caller, actionId]);
}

export async function getAction(actionId: string): Promise<any> {
  return await readContract(EXECUTOR_ADDRESS, "get_action", [actionId]);
}

export async function getAllActionIds(): Promise<string[]> {
  return (await readContract(EXECUTOR_ADDRESS, "get_all_action_ids", [])) as string[];
}

export async function getActionCount(): Promise<number> {
  return Number(await readContract(EXECUTOR_ADDRESS, "get_action_count", []));
}

// ---------- gate ----------
export async function runGate(
  actionId: string,
  kind: string,
  recipient: string,
  amount: number,
  paramName: string,
  paramValue: number,
  proposalUrl: string,
  treasuryBalance: number,
  maxTransferBps: number,
  paramFeeCapBps: number,
  approvedDestinationsJson: string
) {
  return writeContract(GATE_ADDRESS, "run_gate", [
    actionId,
    kind,
    recipient,
    amount,
    paramName,
    paramValue,
    proposalUrl,
    treasuryBalance,
    maxTransferBps,
    paramFeeCapBps,
    approvedDestinationsJson,
  ]);
}

export async function getVerdict(caseId: string): Promise<any> {
  return await readContract(GATE_ADDRESS, "get_verdict", [caseId]);
}

export async function getVerdictCount(): Promise<number> {
  return Number(await readContract(GATE_ADDRESS, "get_verdict_count", []));
}

export async function getAllCaseIds(): Promise<string[]> {
  return (await readContract(GATE_ADDRESS, "get_all_case_ids", [])) as string[];
}
