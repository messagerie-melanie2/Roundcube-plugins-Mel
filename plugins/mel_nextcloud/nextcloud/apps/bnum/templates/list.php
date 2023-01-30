<div id="filelist-header"></div>

<div id="emptycontent" class="hidden">
	<div class="icon-folder"></div>
	<h2><?php p($l->t('No files in here')); ?></h2>
	<p class="uploadmessage hidden"><?php p($l->t('Upload some content or sync with your devices!')); ?></p>
</div>

<div class="nofilterresults emptycontent hidden">
	<div class="icon-search"></div>
	<h2><?php p($l->t('No entries found in this folder')); ?></h2>
	<p></p>
</div>
<table id="filestable" class="list-container <?php p($_['showgridview'] ? 'view-grid' : '') ?>" data-allow-public-upload="<?php p($_['publicUploadEnabled'])?>" data-preview-x="250" data-preview-y="250">
	<thead>
		<tr>
			<th id="headerSelection" class="hidden column-selection">
				<input type="checkbox" id="select_all_files" class="select-all checkbox"/>
				<label for="select_all_files">
					<span class="hidden-visually"><?php p($l->t('Select all'))?></span>
				</label>
			</th>
			<th id='headerName' class="hidden column-name">
				<div id="headerName-container">
					<a class="name sort columntitle" data-sort="name">
                        <span><?php p($l->t('Name')); ?></span>
                        <span class="sort-indicator"></span>

                    </a>
                    <span id="selectedActionsList" class="selectedActions">
                        <a href="" class="actions-selected">
                            <span class="icon icon-more"></span>
                            <span><?php p($l->t('Actions'))?></span>
                        </a>
					</span>
				</div>
			</th>
			<th id="headerSize" class="hidden column-size">
				<a class="size sort columntitle" data-sort="size"><span><?php p($l->t('Size')); ?></span><span class="sort-indicator"></span></a>
			</th>
			<th id="headerDate" class="hidden column-mtime">
				<a id="modified" class="columntitle" data-sort="mtime"><span><?php p($l->t('Modified')); ?></span><span class="sort-indicator"></span></a>
			</th>
		</tr>
	</thead>
	<tbody id="fileList">
	</tbody>
	<tfoot>
	</tfoot>
</table>
<div id="filelist-footer"></div>
<input type="hidden" name="dir" id="dir" value="" />
<div class="hiddenuploadfield">
	<input type="file" id="file_upload_start" class="hiddenuploadfield" name="files[]" />
</div>
<div id="editor"></div><!-- FIXME Do not use this div in your app! It is deprecated and will be removed in the future! -->
<div id="uploadsize-message" title="<?php p($l->t('Upload too large'))?>">
	<p>
	<?php p($l->t('The files you are trying to upload exceed the maximum size for file uploads on this server.'));?>
	</p>
</div>
