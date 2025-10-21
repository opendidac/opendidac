/**
 * Copyright 2022-2024 HEIG-VD
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { useState } from 'react'
import {
  Box,
  Checkbox,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  Menu,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import MoreVertIcon from '@mui/icons-material/MoreVert'

import Row from '../layout/utils/Row'
import Column from '../layout/utils/Column'
import { useRouter } from 'next/router'

const DataGrid = ({
  header,
  items,
  enableSelection = false,
  selection = [],
  onSelectionChange,
  rowStyle,
}) => {
  const all = items.every((item) => selection?.includes(item.id))
  const intermediate =
    !all && items.some((item) => selection?.includes(item.id))

  return (
    <List>
      <ListItem divider>
        <Row>
          {enableSelection && (
            <Column key="select-all" width={30}>
              <Checkbox
                indeterminate={intermediate}
                checked={all}
                size={'small'}
                onClick={(ev) => ev.stopPropagation()}
                onChange={(ev) => {
                  if (ev.target.checked) {
                    onSelectionChange(items.map((item) => item.id))
                  } else {
                    onSelectionChange([])
                  }
                }}
              />
            </Column>
          )}
          {header.columns.map(({ label, tooltip, column }) => (
            <Column key={label} {...column}>
              <Tooltip title={tooltip} placement="bottom">
                <Typography variant="button">{label}</Typography>
              </Tooltip>
            </Column>
          ))}

          {header.actions && (
            <Column key="actions" width={header.actions.width} right>
              <Typography variant="button">{header.actions.label}</Typography>
            </Column>
          )}
        </Row>
      </ListItem>
      {items &&
        items.length > 0 &&
        items.map((item, index) => (
          <ChosenListItemContent
            item={item}
            header={header}
            key={index}
            enableSelection={enableSelection}
            selection={selection}
            onSelectionChange={onSelectionChange}
            rowStyle={rowStyle}
          />
        ))}
    </List>
  )
}

const ChosenListItemContent = ({
  item,
  header,
  enableSelection,
  selection,
  onSelectionChange,
  rowStyle,
}) => {
  if (item.meta?.onClick) {
    return (
      <ClickableListItem
        item={item}
        header={header}
        enableSelection={enableSelection}
        selection={selection}
        onSelectionChange={onSelectionChange}
        onClick={item.meta.onClick}
        key={item.meta.key}
        rowStyle={rowStyle}
      />
    )
  } else if (item.meta?.linkHref) {
    return (
      <LinkHrefListItem
        item={item}
        header={header}
        enableSelection={enableSelection}
        selection={selection}
        onSelectionChange={onSelectionChange}
        href={item.meta.linkHref}
        key={item.meta.key}
        rowStyle={rowStyle}
      />
    )
  } else {
    return (
      <NormalListItem
        key={item.meta.key}
        item={item}
        header={header}
        enableSelection={enableSelection}
        selection={selection}
        onSelectionChange={onSelectionChange}
        rowStyle={rowStyle}
      />
    )
  }
}

const LinkHrefListItem = ({
  item,
  header,
  href,
  enableSelection,
  selection,
  onSelectionChange,
  rowStyle,
}) => {
  const router = useRouter()

  return (
    <ListItemButton
      divider
      onClick={async () => await router.push(href)}
      sx={rowStyle ? rowStyle(item) : undefined}
    >
      <ListItemContent
        item={item}
        header={header}
        enableSelection={enableSelection}
        selection={selection}
        onSelectionChange={onSelectionChange}
      />
    </ListItemButton>
  )
}

const ClickableListItem = ({
  item,
  header,
  onClick,
  enableSelection,
  selection,
  onSelectionChange,
  rowStyle,
}) => (
  <Box onClick={onClick}>
    <ListItemButton
      divider
      sx={{
        cursor: 'pointer',
        ...(rowStyle ? rowStyle(item) : {}),
      }}
    >
      <ListItemContent
        item={item}
        header={header}
        enableSelection={enableSelection}
        selection={selection}
        onSelectionChange={onSelectionChange}
      />
    </ListItemButton>
  </Box>
)

const NormalListItem = ({
  item,
  header,
  enableSelection,
  selection,
  onSelectionChange,
  rowStyle,
}) => (
  <ListItem divider sx={rowStyle ? rowStyle(item) : undefined}>
    <ListItemContent
      item={item}
      header={header}
      enableSelection={enableSelection}
      selection={selection}
      onSelectionChange={onSelectionChange}
    />
  </ListItem>
)

const ListItemContent = ({
  item,
  header,
  enableSelection,
  selection,
  onSelectionChange,
}) => (
  <Row>
    {enableSelection && (
      <Column key="select" width={30}>
        <Checkbox
          size={'small'}
          checked={selection.includes(item.id)}
          onClick={(ev) => ev.stopPropagation()}
          onChange={(ev) => {
            if (ev.target.checked) {
              onSelectionChange([...selection, item.id])
            } else {
              onSelectionChange(selection.filter((id) => id !== item.id))
            }
          }}
        />
      </Column>
    )}
    {header.columns.map(({ renderCell, column }, index) => {
      if (renderCell && item) {
        return (
          <Column key={index} {...column}>
            {renderCell(item)}
          </Column>
        )
      }
    })}
    {item.meta && item.meta.actions && header.actions && (
      <Column key="actions" width={header.actions.width} right>
        <ActionsColumn meta={item.meta} actions={item.meta.actions} />
      </Column>
    )}
  </Row>
)

const ActionsColumn = ({ meta, actions }) => {
  const [anchorEl, setAnchorEl] = useState(null)

  if (actions?.length === 0) {
    return null
  }
  return (
    <>
      {(meta.collapsedActions && actions.length > 0 && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
          }}
        >
          <IconButton
            size="small"
            onClick={(ev) => {
              ev.preventDefault()
              ev.stopPropagation()
              setAnchorEl(ev.currentTarget)
            }}
          >
            <MoreVertIcon />
          </IconButton>
          <ActionsContextMenu
            actions={actions}
            anchorEl={anchorEl}
            handleCloseContextMenu={(ev) => {
              ev.preventDefault()
              ev.stopPropagation()
              setAnchorEl(null)
            }}
          />
        </Box>
      )) ||
        (actions.length > 0 && actions)}
    </>
  )
}
/*
 * ActionsContextMenu
 * When the grid item is collapsed, the actions are displayed in a context menu accessed by clicking the
 * MoreVertIcon (triple point) in the ActionsColumn component
 * @param {Array} actions - array of actions to display in the context menu
 * @param {Element} anchorEl - element to anchor the context menu to
 *
 * */
const ActionsContextMenu = ({ actions, anchorEl, handleCloseContextMenu }) => {
  return (
    <Menu
      sx={{ mt: '40px' }}
      id="grid-context-menu"
      anchorEl={anchorEl}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      keepMounted
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      open={Boolean(anchorEl)}
      onClose={handleCloseContextMenu}
    >
      <Stack padding={2} spacing={2} alignItems={'flex-start'}>
        {actions}
      </Stack>
    </Menu>
  )
}

export default DataGrid
