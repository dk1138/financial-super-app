import React from 'react';
import { useFinance } from '../../lib/FinanceContext';
import { InfoBtn, MonthYearStepper, StepperInput } from '../SharedUI';

export default function PersonalInformationCard() {
  const { data, updateInput, updateMultipleInputs, updateMode } = useFinance();
  const isCouple = data.mode === 'Couple';

  const handleAgeChangeBase = (player: 'p1'|'p2', newAge: number, dobStr: string) => {
      const updates: Record<string, any> = {
          [`${player}_dob`]: dobStr,
          [`${player}_age`]: newAge
      };

      const currentRetAge = data.inputs[`${player}_retireAge`] || 60;
      const currentLifeExp = data.inputs[`${player}_lifeExp`] || 90;
      
      let newRetAge = currentRetAge;
      if (newAge > currentRetAge) {
          newRetAge = newAge;
          updates[`${player}_retireAge`] = newRetAge;
      }
      if (newAge > currentLifeExp) updates[`${player}_lifeExp`] = newAge;

      // Sync the other player if "Retire at same time" is active
      if (isCouple && data.inputs.retire_same_time) {
          const yearsToRetire = newRetAge - newAge;
          const otherPlayer = player === 'p1' ? 'p2' : 'p1';
          const otherAge = data.inputs[`${otherPlayer}_age`] ?? (player === 'p1' ? 34 : 38);
          const otherNewRetAge = Math.max(18, otherAge + yearsToRetire);
          
          updates[`${otherPlayer}_retireAge`] = otherNewRetAge;
          if (otherNewRetAge > (data.inputs[`${otherPlayer}_lifeExp`] || 90)) {
              updates[`${otherPlayer}_lifeExp`] = otherNewRetAge;
          }
      }
      
      updateMultipleInputs(updates);
  };

  const handleDobChange = (player: 'p1'|'p2', dobStr: string) => {
      const newAge = new Date().getFullYear() - parseInt(dobStr.split('-')[0]);
      handleAgeChangeBase(player, newAge, dobStr);
  };

  const handleAgeChange = (player: 'p1'|'p2', newAge: number) => {
      const currentYear = new Date().getFullYear();
      const currentMonth = (data.inputs[`${player}_dob`] || "1990-01").split('-')[1];
      const newDobStr = `${currentYear - newAge}-${currentMonth}`;
      handleAgeChangeBase(player, newAge, newDobStr);
  };

  const handleRetireChange = (player: 'p1'|'p2', newRetAge: number) => {
      const updates: Record<string, any> = { [`${player}_retireAge`]: newRetAge };
      if (newRetAge > (data.inputs[`${player}_lifeExp`] || 90)) {
          updates[`${player}_lifeExp`] = newRetAge;
      }

      // Sync the other player's retirement age mathematically
      if (isCouple && data.inputs.retire_same_time) {
          const playerAge = data.inputs[`${player}_age`] ?? (player === 'p1' ? 38 : 34);
          const yearsToRetire = newRetAge - playerAge;
          
          const otherPlayer = player === 'p1' ? 'p2' : 'p1';
          const otherAge = data.inputs[`${otherPlayer}_age`] ?? (player === 'p1' ? 34 : 38);
          const otherNewRetAge = Math.max(18, otherAge + yearsToRetire);
          
          updates[`${otherPlayer}_retireAge`] = otherNewRetAge;
          if (otherNewRetAge > (data.inputs[`${otherPlayer}_lifeExp`] || 90)) {
              updates[`${otherPlayer}_lifeExp`] = otherNewRetAge;
          }
      }
      updateMultipleInputs(updates);
  };

  const handleSyncToggle = (checked: boolean) => {
      if (checked) {
          const p1Age = data.inputs.p1_age ?? 38;
          const p1Ret = data.inputs.p1_retireAge ?? 60;
          const p2Age = data.inputs.p2_age ?? 34;
          const yearsToRetire = p1Ret - p1Age;
          const newP2Ret = Math.max(18, p2Age + yearsToRetire);
          
          const updates: Record<string, any> = { 
              retire_same_time: true, 
              p2_retireAge: newP2Ret 
          };
          if (newP2Ret > (data.inputs.p2_lifeExp || 95)) updates.p2_lifeExp = newP2Ret;
          updateMultipleInputs(updates);
      } else {
          updateInput('retire_same_time', false);
      }
  };

  return (
    <div className="rp-card border border-secondary rounded-4 mb-4">
      <div className="card-header d-flex flex-wrap align-items-center justify-content-between border-bottom border-secondary p-3 surface-card gap-3">
        <div className="d-flex align-items-center">
          <i className="bi bi-person-vcard text-primary fs-4 me-3"></i>
          <h5 className="mb-0 fw-bold text-uppercase ls-1">1. Personal Information</h5>
          <InfoBtn title="Personal Details" text="Set your Age (or Date of Birth) and targeted Retirement Age. <br><br><b>Life Expectancy</b> defines how long the simulation runs (ensuring you don't run out of money too early)." />
        </div>
        
        <div className="d-flex align-items-center ms-auto gap-3">
            {isCouple && (
                <div className="form-check form-switch mb-0 d-flex align-items-center pe-3 border-end border-secondary">
                    <input className="form-check-input m-0 cursor-pointer" type="checkbox" id="syncRetireToggle" checked={data.inputs.retire_same_time ?? false} onChange={(e) => handleSyncToggle(e.target.checked)} />
                    <label className="form-check-label small fw-bold text-uppercase ls-1 text-muted ms-2 cursor-pointer text-nowrap d-flex align-items-center" htmlFor="syncRetireToggle">
                        Sync Ret.
                        <InfoBtn align="right" title="Sync Retirement" text="Automatically calculates and adjusts your partner's target retirement age so that you both retire in the exact same chronological year." />
                    </label>
                </div>
            )}
            <div className="d-inline-flex bg-input rounded-pill p-1 border border-secondary shadow-sm">
                <button type="button" className={`btn btn-sm rounded-pill px-4 fw-bold transition-all border-0 ${!isCouple ? 'bg-primary shadow text-white' : 'text-muted bg-transparent hover-opacity-100'}`} onClick={() => updateMode('Single')}>Single</button>
                <button type="button" className={`btn btn-sm rounded-pill px-4 fw-bold transition-all border-0 ${isCouple ? 'shadow text-white' : 'text-muted bg-transparent hover-opacity-100'}`} style={isCouple ? {backgroundColor: 'var(--bs-purple)'} : {}} onClick={() => updateMode('Couple')}>Couple</button>
            </div>
        </div>
      </div>
      <div className="card-body p-4">

        <div className="row g-4">
          <div className="col-12 col-xl-6">
            <div className="p-0 border border-secondary rounded-4 shadow-sm surface-card d-flex flex-column h-100">
                <div className="bg-info bg-opacity-10 border-bottom border-secondary p-3 d-flex align-items-center gap-3 rounded-top-4 flex-shrink-0">
                    <div className="bg-info bg-opacity-25 text-info rounded-circle d-flex align-items-center justify-content-center" style={{width: '36px', height: '36px'}}>
                        <i className="bi bi-person-fill fs-5"></i>
                    </div>
                    <h6 className="fw-bold mb-0 text-uppercase ls-1 text-info">Player 1 (P1)</h6>
                </div>
                <div className="p-3 d-flex flex-column gap-2 bg-secondary bg-opacity-10 rounded-bottom-4 flex-grow-1">
                    <div className="d-flex justify-content-between align-items-center p-2 px-3 bg-input border border-secondary rounded-3 shadow-sm gap-3">
                        <span className="small text-muted fw-bold text-nowrap">Birth Date</span>
                        <div className="w-50 flex-grow-1" style={{maxWidth: '240px'}}><MonthYearStepper value={data.inputs.p1_dob} onChange={(val: string) => handleDobChange('p1', val)} /></div>
                    </div>
                    <div className="d-flex justify-content-between align-items-center p-2 px-3 bg-input border border-secondary rounded-3 shadow-sm gap-3">
                        <span className="small text-muted fw-bold text-nowrap">Current Age</span>
                        <div className="w-50 flex-grow-1" style={{maxWidth: '240px'}}><StepperInput min={18} max={100} value={data.inputs.p1_age ?? 38} onChange={(val: any) => handleAgeChange('p1', val)} /></div>
                    </div>
                    <div className="d-flex justify-content-between align-items-center p-2 px-3 bg-input border border-secondary rounded-3 shadow-sm gap-3">
                        <span className="small text-muted fw-bold text-nowrap">Target Retirement</span>
                        <div className="w-50 flex-grow-1" style={{maxWidth: '240px'}}><StepperInput min={data.inputs.p1_age ?? 18} max={100} value={data.inputs.p1_retireAge ?? 60} onChange={(val: any) => handleRetireChange('p1', val)} /></div>
                    </div>
                    <div className="d-flex justify-content-between align-items-center p-2 px-3 bg-input border border-secondary rounded-3 shadow-sm gap-3">
                        <span className="small text-muted fw-bold text-nowrap">Life Expectancy</span>
                        <div className="w-50 flex-grow-1" style={{maxWidth: '240px'}}><StepperInput min={Math.max(data.inputs.p1_age ?? 18, data.inputs.p1_retireAge ?? 60)} max={120} value={data.inputs.p1_lifeExp ?? 90} onChange={(val: any) => updateInput(`p1_lifeExp`, val)} /></div>
                    </div>
                </div>
            </div>
          </div>
          
          {isCouple && (
            <div className="col-12 col-xl-6">
                <div className="p-0 border border-secondary rounded-4 shadow-sm surface-card d-flex flex-column h-100">
                    <div className="border-bottom border-secondary p-3 d-flex align-items-center gap-3 rounded-top-4 flex-shrink-0" style={{ backgroundColor: 'rgba(111, 66, 193, 0.1)' }}>
                        <div className="rounded-circle d-flex align-items-center justify-content-center" style={{width: '36px', height: '36px', backgroundColor: 'rgba(111, 66, 193, 0.25)', color: 'var(--bs-purple)'}}>
                            <i className="bi bi-person-fill fs-5"></i>
                        </div>
                        <h6 className="fw-bold mb-0 text-uppercase ls-1" style={{color: 'var(--bs-purple)'}}>Player 2 (P2)</h6>
                    </div>
                    <div className="p-3 d-flex flex-column gap-2 bg-secondary bg-opacity-10 rounded-bottom-4 flex-grow-1">
                        <div className="d-flex justify-content-between align-items-center p-2 px-3 bg-input border border-secondary rounded-3 shadow-sm gap-3">
                            <span className="small text-muted fw-bold text-nowrap">Birth Date</span>
                            <div className="w-50 flex-grow-1" style={{maxWidth: '240px'}}><MonthYearStepper value={data.inputs.p2_dob} onChange={(val: string) => handleDobChange('p2', val)} /></div>
                        </div>
                        <div className="d-flex justify-content-between align-items-center p-2 px-3 bg-input border border-secondary rounded-3 shadow-sm gap-3">
                            <span className="small text-muted fw-bold text-nowrap">Current Age</span>
                            <div className="w-50 flex-grow-1" style={{maxWidth: '240px'}}><StepperInput min={18} max={100} value={data.inputs.p2_age ?? 34} onChange={(val: any) => handleAgeChange('p2', val)} /></div>
                        </div>
                        <div className="d-flex justify-content-between align-items-center p-2 px-3 bg-input border border-secondary rounded-3 shadow-sm gap-3">
                            <span className="small text-muted fw-bold text-nowrap">Target Retirement</span>
                            <div className="w-50 flex-grow-1" style={{maxWidth: '240px'}}><StepperInput disabled={data.inputs.retire_same_time} min={data.inputs.p2_age ?? 18} max={100} value={data.inputs.p2_retireAge ?? 60} onChange={(val: any) => handleRetireChange('p2', val)} /></div>
                        </div>
                        <div className="d-flex justify-content-between align-items-center p-2 px-3 bg-input border border-secondary rounded-3 shadow-sm gap-3">
                            <span className="small text-muted fw-bold text-nowrap">Life Expectancy</span>
                            <div className="w-50 flex-grow-1" style={{maxWidth: '240px'}}><StepperInput min={Math.max(data.inputs.p2_age ?? 18, data.inputs.p2_retireAge ?? 60)} max={120} value={data.inputs.p2_lifeExp ?? 95} onChange={(val: any) => updateInput(`p2_lifeExp`, val)} /></div>
                        </div>
                    </div>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}