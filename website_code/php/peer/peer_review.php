<?php
/**
 * Licensed to The Apereo Foundation under one or more contributor license
 * agreements. See the NOTICE file distributed with this work for
 * additional information regarding copyright ownership.

 * The Apereo Foundation licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except in
 * compliance with the License. You may obtain a copy of the License at:
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.

 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 *
 * peer view page, sends the email back to the
 *
 * @author Patrick Lockley
 * @version 1.0
 * @package
 */

require_once("../../../config.php");

_load_language_file("/website_code/php/peer/peer_review.inc");

if(empty($_POST['template_id'])) {
    die("invalid form submission");
}

$query_for_file_name = "select template_name from {$xerte_toolkits_site->database_table_prefix}templatedetails where template_id =?";

$row_template_name = db_query_one($query_for_file_name, array($_POST['template_id']));

$query_for_access_to_whom = "select access_to_whom from {$xerte_toolkits_site->database_table_prefix}templatedetails where template_id =?";

$row_access_to_whom = db_query_one($query_for_access_to_whom, array($_POST['template_id']));
$access=$row_access_to_whom["access_to_whom"];

$headers = get_email_headers();

if(isset($_POST['retouremail'])){

    if($xerte_toolkits_site->apache=="true") {
        $playstring = "peerreview_";
        if($row_access_to_whom["access_to_whom"]=="Public"){
            $playstring = "play_";
        }
    }else{
        $playstring = "peer.php?template_id=";
        if($row_access_to_whom["access_to_whom"]=="Public"){
            $playstring = "play.php?template_id=";
        }
    }


    $subject = PEER_REVIEW_FEEDBACK . " - \"" . str_replace("_"," ",$row_template_name['template_name']) ."\"";

    $message = PEER_REVIEW_EMAIL_GREETING . " <br><br> " . PEER_REVIEW_EMAIL_INTRO . " ". str_replace("_"," ",$row_template_name['template_name']) ."."."<br><br><br><a href='" . $xerte_toolkits_site->site_url . $playstring . $_POST['template_id'] . "'>" . $xerte_toolkits_site->site_url . $playstring . $_POST['template_id'] . "</a><br><br><br>" . str_replace("\n", "<br>\n", $_POST['feedback']) . "<br><br><br>" . PEER_REVIEW_EMAIL_YOURS . "<br><br>" . PEER_REVIEW_EMAIL_SIGNATURE;

    if(mail( $_POST['retouremail'], $subject, $message, $headers)){

        echo "<b>" . PEER_REVIEW_USER_FEEDBACK . "</b>";

    }else{

        echo "<b>" . PEER_REVIEW_PROBLEM . ".</b>";

    }

}

?>
