<?php
class Mail {
    public $subject;
    public $date;
    public $from;
    public $id;
    public $uid;
    public function __construct($rc_mail){
        $this->subject = rcube_mime::decode_header($rc_mail->subject, $rc_mail->charset);
        $this->date = $rc_mail->date;
        $this->from = rcube_mime::decode_header($rc_mail->from, $rc_mail->charset);
        $this->id = $rc_mail->id;
        $this->uid = $rc_mail->uid;
    }   
}