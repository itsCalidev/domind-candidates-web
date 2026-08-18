import {
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import { useLocation, useNavigate } from 'react-router-dom';
import { getVisibleNavItems } from './navItems';
import { AccessibilityMenu } from './AccessibilityMenu';
import { useLayout } from './LayoutContext';
import { paths } from '@/routes/paths';
import { useAuth } from '@/features/auth/context/AuthContext';

export const SIDEBAR_WIDTH_EXPANDED = 248;
export const SIDEBAR_WIDTH_COLLAPSED = 76;

export function Sidebar() {
  const { isSidebarCollapsed, toggleSidebar, isMobileSidebarOpen, setMobileSidebarOpen } =
    useLayout();
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const visibleNavItems = getVisibleNavItems(user?.role);

  const width = isSidebarCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED;

  const content = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'primary.dark',
        color: '#fff',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isSidebarCollapsed ? 'center' : 'space-between',
          px: isSidebarCollapsed ? 1 : 2.5,
          py: 2.5,
        }}
      >
        {!isSidebarCollapsed && (
          <Typography variant="h6" sx={{ letterSpacing: 0.5 }}>
            DOMIND
          </Typography>
        )}
        <IconButton
          onClick={toggleSidebar}
          size="small"
          aria-label={isSidebarCollapsed ? 'Expandir menú' : 'Contraer menú'}
          sx={{ color: 'rgba(255,255,255,0.8)', display: { xs: 'none', md: 'inline-flex' } }}
        >
          {isSidebarCollapsed ? (
            <ChevronRightIcon fontSize="small" />
          ) : (
            <ChevronLeftIcon fontSize="small" />
          )}
        </IconButton>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

      <List sx={{ flex: 1, px: 1, py: 1.5 }}>
        {visibleNavItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          const Icon = item.icon;

          const button = (
            <ListItemButton
              key={item.path}
              selected={isActive}
              onClick={() => {
                navigate(item.path);
                setMobileSidebarOpen(false);
              }}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                px: isSidebarCollapsed ? 1.5 : 2,
                '&.Mui-selected': {
                  bgcolor: 'rgba(255,255,255,0.12)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.16)' },
                },
                '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: isSidebarCollapsed ? 0 : 1.5,
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.7)',
                  justifyContent: 'center',
                }}
              >
                <Icon fontSize="small" />
              </ListItemIcon>
              {!isSidebarCollapsed && (
                <ListItemText
                  primary={item.label}
                  slotProps={{
                    primary: { fontSize: 14, fontWeight: isActive ? 600 : 400 },
                  }}
                />
              )}
            </ListItemButton>
          );

          return isSidebarCollapsed ? (
            <Tooltip key={item.path} title={item.label} placement="right">
              {button}
            </Tooltip>
          ) : (
            button
          );
        })}
      </List>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

      <Box sx={{ p: 1 }}>
        <AccessibilityMenu isSidebarCollapsed={isSidebarCollapsed} />
        <ListItemButton
          onClick={async () => {
            await logout();
            navigate(paths.login);
          }}
          sx={{
            borderRadius: 2,
            justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
            px: isSidebarCollapsed ? 1.5 : 2,
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 0,
              mr: isSidebarCollapsed ? 0 : 1.5,
              color: 'rgba(255,255,255,0.7)',
              justifyContent: 'center',
            }}
          >
            <LogoutOutlinedIcon fontSize="small" />
          </ListItemIcon>
          {!isSidebarCollapsed && (
            <ListItemText primary="Cerrar sesión" slotProps={{ primary: { fontSize: 14 } }} />
          )}
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Desktop: drawer permanente y colapsable */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width,
          flexShrink: 0,
          transition: (theme) => theme.transitions.create('width'),
          '& .MuiDrawer-paper': {
            width,
            boxSizing: 'border-box',
            border: 'none',
            transition: (theme) => theme.transitions.create('width'),
            overflowX: 'hidden',
          },
        }}
      >
        {content}
      </Drawer>

      {/* Mobile: drawer temporal sobrepuesto */}
      <Drawer
        variant="temporary"
        open={isMobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH_EXPANDED, boxSizing: 'border-box' },
        }}
      >
        {content}
      </Drawer>
    </>
  );
}
