<?php
/*
Plugin Name: Import VK
Plugin URI: https://vkmate.ru
Text Domain: import-vk
Description: The plugin allows you to import posts from any VKontakte (vk.com) wall.
Version: 1.0.2
Author: Vadim Alekseenko
Author URI: https://riselab.ru
*/

/**
 * Plugin class
 */
class ImportVK
{
	const OPTION_NAME = 'import_vk_options';
	const VK_API_VERSION = '5.199';

	// Init function
	public static function Init()
	{
		// Loading plugin's text domain
		add_action('plugins_loaded', [get_called_class(), 'LoadTextDomain']);
		
		// Adding settings page to the administration panel menu
		if (defined('ABSPATH') && is_admin()){
			add_action('admin_menu', [get_called_class(), 'SettingsMenu']);
			add_action('admin_init', [get_called_class(), 'RegisterSettings']);
		}

		// Importing posts
		add_action('wp_ajax_import_posts', [get_called_class(), 'ImportPosts']);
	}

	// Get settings page content function
	public static function SettingsPage()
	{
		include(plugin_dir_path(__FILE__) . '/inc/settings-page.php');
	}

	// Add settings page to the administration panel menu function
	public static function SettingsMenu()
	{
		// Checking permissions
		if (!current_user_can('manage_options')){
			return;
		}
		// Plugin settings page registration
		$settingsPage = add_submenu_page(
			'tools.php',
			'Import VK',
			'Import VK',
			'manage_options',
			'import-vk',
			[get_called_class(), 'SettingsPage']
		);
		// Connecting to the necessary event using plugin settings page id
		add_action('admin_print_styles-' . $settingsPage, [get_called_class(), 'SettingsPageStyles']);
		add_action('admin_print_scripts-' . $settingsPage, [get_called_class(), 'SettingsPageScripts']);
	}

	// Adding settings page styles function
	public static function SettingsPageStyles()
	{
		wp_enqueue_style('jquery-ui.min.css', plugins_url('inc/css/jquery-ui.min.css', __FILE__));
		wp_enqueue_style('jquery-ui-slider-pips.css', plugins_url('inc/css/jquery-ui-slider-pips.css', __FILE__));
		wp_enqueue_style(
			'bootstrap-datetimepicker.min.css',
			plugins_url('inc/css/bootstrap-datetimepicker.min.css', __FILE__)
		);
		wp_enqueue_style('bootstrap.min.css', plugins_url('inc/css/bootstrap.min.css', __FILE__));
		wp_enqueue_style('main.css', plugins_url('inc/css/main.css', __FILE__));
	}

	// Adding settings page scripts function
	public static function SettingsPageScripts()
	{
		wp_enqueue_script('jquery-ui-slider');
		wp_enqueue_script('bootstrap.min.js', plugins_url('inc/js/bootstrap.min.js', __FILE__));
		wp_enqueue_script('jquery-ui-slider-pips.js', plugins_url('inc/js/jquery-ui-slider-pips.js', __FILE__));
		wp_enqueue_script('moment-with-locales.min.js', plugins_url('inc/js/moment-with-locales.min.js', __FILE__));
		wp_enqueue_script(
			'bootstrap-datetimepicker.min.js',
			plugins_url('inc/js/bootstrap-datetimepicker.min.js', __FILE__)
		);
		wp_enqueue_script('main.js', plugins_url('inc/js/main.js', __FILE__), ['jquery-ui-slider'], '1');
		wp_localize_script('main.js', 'scriptParams', [
			'ajaxUrl' => admin_url('admin-ajax.php'),
			'progressDefaultText' => __('preparing', 'import-vk'),
			'errorWord' => __('Error', 'import-vk'),
			'importCompleted' => __('Import successfully completed.', 'import-vk'),
		]);
	}

	// Register plugins settings function
	public static function RegisterSettings()
	{
		register_setting('import-vk-option-group', self::OPTION_NAME);
	}

	// Getting page content function
	public static function GetPageContent($url)
	{
		$response = wp_remote_get($url);
		$result = wp_remote_retrieve_body($response);
		return $result;
	}

	// Load plugin's text domain function
	public static function LoadTextDomain()
	{
		load_plugin_textdomain('import-vk');
	}

	// Import posts function
	public static function ImportPosts()
	{
		// Set script execution time limit
		set_time_limit(120);

		// Set timezone
		date_default_timezone_set(
			timezone_name_from_abbr('', 3600 * get_option('gmt_offset'), false)
		);

		// Get vk.com access_token from POST-request
		$vkAccessToken = sanitize_text_field($_POST['vkAccessToken']);
		// Page identifier
		$pageId = intval($_POST['pageId']);
		$pageOwner = $_POST['pageOwner'];
		// Posts selection offset
		$postsOffset = intval($_POST['postsOffset']);
		// Processed posts count
		$postsDone = intval($_POST['postsDone']);
		// Post ids array
		$postsIds = sanitize_text_field(implode(',' . $pageId . '_', $_POST['postsIds']));

		// Get wall data
		$url = 'https://api.vk.com/method/wall.getById?posts=' . $pageId . '_' . $postsIds
			. '&extended=1&v=' . self::VK_API_VERSION . '&access_token=' . $vkAccessToken;
		$curlResult = self::GetPageContent($url);
		$curlResult = json_decode($curlResult, true);
		// Import records to WordPress
		foreach ($curlResult['response']['items'] as $itemKey => $item){
			$recText = '';
			if (!empty($item['text'])){
				$recText .= str_replace("\n", "<br>\n", $item['text']) . "<br><br>\n";
			}
			// Attachments
			if (isset($item['attachments'])){
				foreach ($item['attachments'] as $attachment){
					switch ($attachment['type']){
						case 'audio':
							$recText .= <<<HERE
<span class="glyphicon glyphicon-music small text-info"></span>
<a href="{$attachment['audio']['url']}" target="_blank">
	{$attachment['audio']['artist']} - {$attachment['audio']['title']}
</a>
<br>
<audio controls="controls" preload="metadata" src="{$attachment['audio']['url']}"></audio><br><br>

HERE;
							break;
						case 'link':
							$recText .= <<<HERE
<blockquote>
	<p><strong><a href="{$attachment['link']['url']}">{$attachment['link']['title']}</a></strong></p>
	<p class="small"><a href="{$attachment['link']['url']}">{$attachment['link']['url']}</a></p>
	<p>

HERE;
							$recText .= "\t\t" . str_replace(
								"\n", "<br>\n\t\t", $attachment['link']['description']
							) . "\n";
							$recText .= <<<HERE
	</p>
</blockquote><br><br>

HERE;
							break;
						case 'photo':
							$photoUrl = $attachment['photo']['orig_photo']['url'];
							$recText .= <<<HERE
<a href="{$photoUrl}" target="_blank">
	<img src="{$photoUrl}" alt="" class="img-responsive img-thumbnail">
</a><br><br>

HERE;

							break;
						case 'doc':
							$recText .= <<<HERE
<span class="glyphicon glyphicon-file small text-info"></span>
Файл
<a href="{$attachment['doc']['url']}" target="_blank">
	{$attachment['doc']['title']}
</a><br><br>

HERE;

							break;
						case 'video':
							// Get video url
							$url = 'https://api.vk.com/method/video.get?videos=' . $attachment['video']['owner_id']
								. '_' . $attachment['video']['id'] . '_' . $attachment['video']['access_key']
								. '&v=' . self::VK_API_VERSION . '&access_token=' . $vkAccessToken;
							$curlResultSub1 = self::GetPageContent($url);
							// Delay
							usleep(250000);
							$curlResultSub1 = json_decode($curlResultSub1, true);
							$recText .= <<<HERE
<span class="glyphicon glyphicon-film small text-info"></span>
<a href="{$curlResultSub1['response']['items'][0]['player']}" target="_blank">
	{$attachment['video']['title']}
</a>
<br>
<div class="embed-responsive embed-responsive-16by9">
	<iframe class="embed-responsive-item" src="{$curlResultSub1['response']['items'][0]['player']}"></iframe>
</div><br><br>

HERE;
							break;
						default:
							break;
					}
				}
			}
			// Repost
			if (isset($item['copy_history'])){
				$recText .= $recText ? "<hr><br><br>\n" : '';
				$recRepost = $item['copy_history'][0];
				if (!empty($recRepost['text'])){
					$recText .= str_replace("\n", "<br>\n", $recRepost['text']) . "<br><br>\n";
				}
				// Attachments
				if (isset($recRepost['attachments'])){
					foreach ($recRepost['attachments'] as $attachment){
						switch ($attachment['type']){
							case 'audio':
								$recText .= <<<HERE
<span class="glyphicon glyphicon-music small text-info"></span>
<a href="{$attachment['audio']['url']}" target="_blank">
	{$attachment['audio']['artist']} - {$attachment['audio']['title']}
</a>
<br>
<audio controls="controls" preload="metadata" src="{$attachment['audio']['url']}"></audio><br><br>

HERE;
								break;
							case 'link':
								$recText .= <<<HERE
<blockquote>
	<p><strong><a href="{$attachment['link']['url']}">{$attachment['link']['title']}</a></strong></p>
	<p class="small"><a href="{$attachment['link']['url']}">{$attachment['link']['url']}</a></p>
	<p>

HERE;
								$recText .= "\t\t" . str_replace(
									"\n", "<br>\n\t\t", $attachment['link']['description']
								) . "\n";
								$recText .= <<<HERE
	</p>
</blockquote><br><br>

HERE;
								break;
							case 'photo':
								$photoUrl = $attachment['photo']['orig_photo']['url'];
								$recText .= <<<HERE
<a href="{$photoUrl}" target="_blank">
	<img src="{$photoUrl}" alt="" class="img-responsive img-thumbnail">
</a><br><br>

HERE;

								break;
							case 'doc':
								$recText .= <<<HERE
<span class="glyphicon glyphicon-file small text-info"></span>
Файл
<a href="{$attachment['doc']['url']}" target="_blank">
	{$attachment['doc']['title']}
</a><br><br>

HERE;

								break;
							case 'video':
								// Get video url
								$url = 'https://api.vk.com/method/video.get?videos=' . $attachment['video']['owner_id']
									. '_' . $attachment['video']['id'] . '_' . $attachment['video']['access_key']
									. '&v=' . self::VK_API_VERSION . '&access_token=' . $vkAccessToken;
								$curlResultSub1 = self::GetPageContent($url);
								// Delay
								usleep(250000);
								$curlResultSub1 = json_decode($curlResultSub1, true);
								$recText .= <<<HERE
<span class="glyphicon glyphicon-film small text-info"></span>
<a href="{$curlResultSub1['response']['items'][0]['player']}" target="_blank">
	{$attachment['video']['title']}
</a>
<br>
<div class="embed-responsive embed-responsive-16by9">
	<iframe class="embed-responsive-item" src="{$curlResultSub1['response']['items'][0]['player']}"></iframe>
</div><br><br>

HERE;
								break;
							default:
								break;
						}
					}
				}
			}
			// Remove excess line break tags from the end of string
			if (substr(rtrim($recText), -8) == '<br><br>'){
				$recText = substr(rtrim($recText), 0, -8) . "\n";
			}

			// WordPress post data
			$wpPostData = [
				'post_type' => get_option(self::OPTION_NAME)['post_type'],
				'post_title' => strip_tags($pageOwner . ' (' . date('Y-m-d H:i:s \G\M\TP', $item['date']) . ')'),
				'post_content' => $recText,
				'post_status' => get_option(self::OPTION_NAME)['post_status'],
				'post_date' => date('Y-m-d H:i:s', $item['date']),
			];

			// Create WordPress post
			wp_insert_post($wpPostData);
		}

		// Return browse link url
		$result['browseLink'] = admin_url('edit.php') . '?post_type=' . get_option(self::OPTION_NAME)['post_type'];
		// Return new offset value
		$result['postsOffset'] = $postsOffset + $itemKey + 1;
		// Return processed posts value
		$result['postsDone'] = $postsDone + $itemKey + 1;

		// Delay
		usleep(250000);

		// Send result in JSON format
		echo json_encode($result);

		wp_die();
	}

}

// Plugin initialization
ImportVK::Init();
