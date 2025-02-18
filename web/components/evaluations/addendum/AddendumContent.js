import { Stack } from '@mui/material'
import BottomPanelContent from '@/components/layout/utils/BottomPanelContent'
import MarkdownEditor from '@/components/input/markdown/MarkdownEditor'

const AddendumContent = ({ 
  groupScope, 
  addendum, 
  readOnly,
  onAddendumChange 
}) => {
  return (
    <BottomPanelContent>
      <Stack minHeight={"500px"} height={"100%"} pl={1} pr={1}>
        <MarkdownEditor
          groupScope={groupScope}
          readOnly={readOnly}
          rawContent={addendum}
          onChange={onAddendumChange}
        />
      </Stack>
    </BottomPanelContent>
  )
}

export default AddendumContent 