import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

interface LoglinkSettings {
	token: string;
}

const DEFAULT_SETTINGS: LoglinkSettings = {
	token: ''
}

class LoglinkSettingTab extends PluginSettingTab {
	private plugin: Plugin;

	constructor(app: App, plugin: Plugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		let {containerEl} = this;

		containerEl.empty();
		containerEl.createEl('h1', {text: 'Settings for Loglink plugin'});

		containerEl.createEl('p', {text: 'LogLink is a service that allows you to send messages to Obsidian from Telegram.'});
		containerEl.createEl('p', {text: 'Full instructions for setting up LogLink are available at:'});
		containerEl.createEl('a', {text: 'https://loglink.it', href: 'https://loglink.it'});
		containerEl.createEl('p', {text: ''});


		new Setting(containerEl)
			.setName('Token')
			.setDesc('Enter the token you received from the LogLink Telegram bot here')
			.addText(text => text
				.setPlaceholder('telegramabcdefgh123456')
				.setValue(this.plugin.settings.token)

				.onChange(async (value) => {
					this.plugin.settings.token = value;
					await this.plugin.saveSettings();
				})
			);
		}

	}


/* function to fetch data from LogLink */
async function loadRemoteData(userID: string) {

	// Set the URL to either the default or the user's custom URL
	let remoteAppURL = 'https://api.loglink.it/';
	let localAppURL = 'http://127.0.0.1:5010/'
	let appURL = remoteAppURL;
	let endpoint = appURL + 'get_new_messages/';

	// Crete the results array, which we will use to return the responses
	let results_array = [];

	console.log(endpoint);

	let object_to_send = {
		'user_id': userID,
		'plugin_version': '0.2.1'
	}

	// Send the request in JSON format to the endpoint
	let response = await fetch(endpoint, {
		method: 'POST',
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(object_to_send)
	});

	let data = await response.json();
	let status = await response.status;

	if (status === 200) {
		let messages = data.messages.contents;
		messages.forEach(function (item, index) {
			results_array.push(item['contents']);
		});
	} else {
		results_array.push("There was an error fetching your data from LogLink. Error code was " + status + ".");
		results_array.push(data.message)
		console.log(data);
	}

	return results_array;
}




export default class LoglinkPlugin extends Plugin {
	settings: LoglinkSettings;

	async onload() {
		await this.loadSettings();
		
		this.addSettingTab(new LoglinkSettingTab(this.app, this));

		
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Get data from LogLink',
			editorCallback: async (editor: Editor, view: MarkdownView) => {

				// Check if the user has entered a token
				if (this.settings.token === '') {
					new Notice("❌ You haven't entered a LogLink token. Please enter a token in the settings.")
					return;
				}

				new Notice("♻︎ Fetching data from LogLink... with token " + this.settings.token)

				let results = await loadRemoteData(this.settings.token);
				new Notice ("✅ Data fetched from LogLink")

				// Format the message
				let base_message = "Inserted from [[LogLink]] on " + new Date().toLocaleString() + ":\n"
				
				// Go through each message and add it to the base message with a - at the start
				let fullmessage = base_message
				results.forEach(function (item, index) {
					fullmessage = fullmessage + "- " + item + "\n"
				});

				editor.replaceSelection(fullmessage)
				
			}
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

