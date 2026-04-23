function getSkillsCurrency() {
    return Number(localStorage.getItem("currency") || "0");
}

function getSkillsSystems() {
    return window.DedogeiumSystems || null;
}

window.addEventListener("DOMContentLoaded", function() {
    const systems = getSkillsSystems();
    const currencyEl = document.getElementById("skills-currency");
    const modeButtons = Array.from(document.querySelectorAll(".mode-btn"));
    const shopList = document.getElementById("skills-shop-list");
    const ownedList = document.getElementById("owned-skills-list");
    const autoSection = document.getElementById("auto-section");
    const manualSection = document.getElementById("manual-section");
    const manualList = document.getElementById("manual-loadout-list");
    const pageMessage = document.getElementById("skills-message");

    if (!systems || typeof systems.getSkillStateSnapshot !== "function") {
        if (pageMessage) {
            pageMessage.textContent = "The shared skills system could not load.";
            pageMessage.className = "message error";
        }
        return;
    }

    function setMessage(text, type) {
        if (!pageMessage) return;
        pageMessage.textContent = text || "";
        pageMessage.className = `message ${type || ""}`.trim();
    }

    function getSnapshot() {
        return systems.getSkillStateSnapshot();
    }

    function refreshCurrency() {
        if (currencyEl) {
            currencyEl.textContent = String(getSkillsCurrency());
        }
    }

    function renderMode(state) {
        modeButtons.forEach((button) => {
            button.classList.toggle("active", button.dataset.mode === state.mode);
        });
        if (autoSection) autoSection.hidden = state.mode !== "auto";
        if (manualSection) manualSection.hidden = state.mode !== "manual";
    }

    function renderShop(snapshot) {
        if (!shopList) return;
        shopList.innerHTML = "";

        snapshot.catalog.forEach((skill) => {
            const owned = snapshot.state.ownedSkills.includes(skill.id);
            const card = document.createElement("article");
            card.className = "skill-card";
            card.innerHTML = `
                <h4>${skill.label}</h4>
                <div class="skill-meta">
                    <span class="skill-badge">Cost ${skill.cost}</span>
                    <span class="skill-badge">Unlock turn ${skill.unlockTurn}</span>
                </div>
                <p>${skill.description}</p>
                <button type="button" class="action-btn buy-skill-btn" data-skill-id="${skill.id}" ${owned ? "disabled" : ""}>
                    ${owned ? "Bought" : "Buy skill"}
                </button>
            `;
            shopList.appendChild(card);
        });
    }

    function renderOwnedSkills(snapshot) {
        if (!ownedList) return;
        ownedList.innerHTML = "";

        if (!snapshot.state.ownedSkills.length) {
            ownedList.innerHTML = `<p class="tiny-note">No skills bought yet. Start with Healing Pulse or Iron Guard, then save up for the later skills.</p>`;
            return;
        }

        snapshot.state.ownedSkills.forEach((skillId) => {
            const skill = snapshot.catalog.find((entry) => entry.id === skillId);
            const rule = snapshot.state.autoRules[skillId];
            if (!skill || !rule) return;

            const card = document.createElement("article");
            card.className = "skill-card";
            card.innerHTML = `
                <h4>${skill.label}</h4>
                <div class="skill-meta">
                    <span class="skill-badge">Unlock turn ${skill.unlockTurn}</span>
                    <span class="skill-badge">${skill.kind}</span>
                </div>
                <p>${skill.description}</p>
                <div class="rule-row">
                    <label>
                        <input type="checkbox" class="auto-rule-enabled" data-skill-id="${skill.id}" ${rule.enabled ? "checked" : ""}>
                        Auto-use this skill
                    </label>
                    <label>
                        Minimum turn
                        <input type="number" min="${skill.unlockTurn}" max="20" value="${rule.minTurn}" class="auto-rule-turn" data-skill-id="${skill.id}">
                    </label>
                    <label>
                        HP trigger threshold
                        <input type="number" min="0" max="100" value="${rule.hpThreshold}" class="auto-rule-hp" data-skill-id="${skill.id}">
                    </label>
                </div>
            `;
            ownedList.appendChild(card);
        });
    }

    function renderAutoControls(snapshot) {
        const state = snapshot.state;
        const ids = {
            aggression: document.getElementById("auto-aggression"),
            healThreshold: document.getElementById("auto-heal-threshold"),
            guardThreshold: document.getElementById("auto-guard-threshold"),
            finisherThreshold: document.getElementById("auto-finisher-threshold"),
            maxAutoSkillsPerBattle: document.getElementById("auto-max-uses"),
        };

        if (ids.aggression) ids.aggression.value = state.autoSettings.aggression;
        if (ids.healThreshold) ids.healThreshold.value = state.autoSettings.healThreshold;
        if (ids.guardThreshold) ids.guardThreshold.value = state.autoSettings.guardThreshold;
        if (ids.finisherThreshold) ids.finisherThreshold.value = state.autoSettings.finisherThreshold;
        if (ids.maxAutoSkillsPerBattle) ids.maxAutoSkillsPerBattle.value = state.autoSettings.maxAutoSkillsPerBattle;
    }

    function renderManualLoadout(snapshot) {
        if (!manualList) return;
        manualList.innerHTML = "";

        if (!snapshot.state.ownedSkills.length) {
            manualList.innerHTML = `<p class="tiny-note">Buy skills first, then pick up to 3 for manual use in battle.</p>`;
            return;
        }

        snapshot.state.ownedSkills.forEach((skillId) => {
            const skill = snapshot.catalog.find((entry) => entry.id === skillId);
            if (!skill) return;
            const selected = snapshot.state.manualLoadout.includes(skill.id);
            const atCapacity = snapshot.state.manualLoadout.length >= 3 && !selected;

            const card = document.createElement("article");
            card.className = "loadout-card";
            card.innerHTML = `
                <h4>${skill.label}</h4>
                <p>Unlocks on turn ${skill.unlockTurn}. ${skill.description}</p>
                <button type="button" class="chip-btn manual-toggle-btn ${selected ? "active" : ""}" data-skill-id="${skill.id}" ${atCapacity ? "disabled" : ""}>
                    ${selected ? "Selected" : "Select"}
                </button>
            `;
            manualList.appendChild(card);
        });
    }

    function renderPage() {
        const snapshot = getSnapshot();
        refreshCurrency();
        renderMode(snapshot.state);
        renderShop(snapshot);
        renderOwnedSkills(snapshot);
        renderAutoControls(snapshot);
        renderManualLoadout(snapshot);
    }

    modeButtons.forEach((button) => {
        button.addEventListener("click", function() {
            const mode = button.dataset.mode;
            systems.setSkillMode(mode);
            setMessage(`Skills mode set to ${mode}.`, "success");
            renderPage();
        });
    });

    if (shopList) {
        shopList.addEventListener("click", function(event) {
            const button = event.target.closest(".buy-skill-btn");
            if (!button) return;
            const result = systems.buySkill(button.dataset.skillId);
            if (!result.ok) {
                setMessage(result.error || "That skill could not be bought.", "error");
            } else {
                setMessage("Skill bought. You can now configure it below.", "success");
            }
            renderPage();
        });
    }

    if (ownedList) {
        ownedList.addEventListener("change", function(event) {
            const enabledTarget = event.target.closest(".auto-rule-enabled");
            if (enabledTarget) {
                systems.updateAutoSkillRule(enabledTarget.dataset.skillId, { enabled: enabledTarget.checked });
                setMessage("Auto skill rule updated.", "success");
                renderPage();
                return;
            }

            const turnTarget = event.target.closest(".auto-rule-turn");
            if (turnTarget) {
                systems.updateAutoSkillRule(turnTarget.dataset.skillId, { minTurn: Number(turnTarget.value) || 0 });
                setMessage("Minimum turn updated.", "success");
                renderPage();
                return;
            }

            const hpTarget = event.target.closest(".auto-rule-hp");
            if (hpTarget) {
                systems.updateAutoSkillRule(hpTarget.dataset.skillId, { hpThreshold: Number(hpTarget.value) || 0 });
                setMessage("HP trigger updated.", "success");
                renderPage();
            }
        });
    }

    if (manualList) {
        manualList.addEventListener("click", function(event) {
            const button = event.target.closest(".manual-toggle-btn");
            if (!button) return;
            const snapshot = getSnapshot();
            const skillId = button.dataset.skillId;
            const current = snapshot.state.manualLoadout.slice();
            const next = current.includes(skillId)
                ? current.filter((entry) => entry !== skillId)
                : current.concat(skillId).slice(0, 3);
            systems.setManualSkillLoadout(next);
            setMessage("Manual loadout updated.", "success");
            renderPage();
        });
    }

    ["auto-aggression", "auto-heal-threshold", "auto-guard-threshold", "auto-finisher-threshold", "auto-max-uses"].forEach((id) => {
        const element = document.getElementById(id);
        if (!element) return;
        element.addEventListener("change", function() {
            systems.updateAutoSkillSettings({
                aggression: document.getElementById("auto-aggression") && document.getElementById("auto-aggression").value,
                healThreshold: document.getElementById("auto-heal-threshold") && document.getElementById("auto-heal-threshold").value,
                guardThreshold: document.getElementById("auto-guard-threshold") && document.getElementById("auto-guard-threshold").value,
                finisherThreshold: document.getElementById("auto-finisher-threshold") && document.getElementById("auto-finisher-threshold").value,
                maxAutoSkillsPerBattle: document.getElementById("auto-max-uses") && document.getElementById("auto-max-uses").value,
            });
            setMessage("Auto settings updated.", "success");
            renderPage();
        });
    });

    renderPage();
});
