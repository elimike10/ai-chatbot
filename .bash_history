PS1='PROMPT_GGRRAUVVJRXN\[\]>' PS2='PROMPT_GGRRAUVVJRXN\[\]+' PROMPT_COMMAND=''
export PAGER=cat
bind 'set enable-bracketed-paste off' >/dev/null 2>&1 || true
display () {     display_id="$1"; shift;     TMPFILE=$(mktemp ${TMPDIR-/tmp}/bash_kernel.XXXXXXXXXX);     cat > $TMPFILE;     prefix="bash_kernel: saved image data to: ";     if [[ "${display_id}" != "" ]]; then         echo "${prefix}(${display_id}) $TMPFILE" >&2;     else         echo "${prefix}$TMPFILE" >&2;     fi; }
displayHTML () {     display_id="$1"; shift;     TMPFILE=$(mktemp ${TMPDIR-/tmp}/bash_kernel.XXXXXXXXXX);     cat > $TMPFILE;     prefix="bash_kernel: saved html data to: ";     if [[ "${display_id}" != "" ]]; then         echo "${prefix}(${display_id}) $TMPFILE" >&2;     else         echo "${prefix}$TMPFILE" >&2;     fi; }
displayJS () {     display_id="$1"; shift;     TMPFILE=$(mktemp ${TMPDIR-/tmp}/bash_kernel.XXXXXXXXXX);     cat > $TMPFILE;     prefix="bash_kernel: saved javascript data to: ";     if [[ "${display_id}" != "" ]]; then         echo "${prefix}(${display_id}) $TMPFILE" >&2;     else         echo "${prefix}$TMPFILE" >&2;     fi; }
export NOTEBOOK_BASH_KERNEL_CAPABILITIES="image,html,javascript"
{ echo $?; } 2>/dev/null
import os
os.environ["JUPYTER_PWD"] = "/home/user/"
{ echo $?; } 2>/dev/null
rm -f .bash_history
git clean -fd
cd ai-chatbot
git add .
git commit -m "fix #4: Remove login requirement for chat API and related components"
git push -f https://$GITHUB_TOKEN@github.com/elimike10/ai-chatbot.git fix-4-remove-login-final
exit
PS1='PROMPT_GGRRAUVVJRXN\[\]>' PS2='PROMPT_GGRRAUVVJRXN\[\]+' PROMPT_COMMAND=''
export PAGER=cat
bind 'set enable-bracketed-paste off' >/dev/null 2>&1 || true
display () {     display_id="$1"; shift;     TMPFILE=$(mktemp ${TMPDIR-/tmp}/bash_kernel.XXXXXXXXXX);     cat > $TMPFILE;     prefix="bash_kernel: saved image data to: ";     if [[ "${display_id}" != "" ]]; then         echo "${prefix}(${display_id}) $TMPFILE" >&2;     else         echo "${prefix}$TMPFILE" >&2;     fi; }
displayHTML () {     display_id="$1"; shift;     TMPFILE=$(mktemp ${TMPDIR-/tmp}/bash_kernel.XXXXXXXXXX);     cat > $TMPFILE;     prefix="bash_kernel: saved html data to: ";     if [[ "${display_id}" != "" ]]; then         echo "${prefix}(${display_id}) $TMPFILE" >&2;     else         echo "${prefix}$TMPFILE" >&2;     fi; }
displayJS () {     display_id="$1"; shift;     TMPFILE=$(mktemp ${TMPDIR-/tmp}/bash_kernel.XXXXXXXXXX);     cat > $TMPFILE;     prefix="bash_kernel: saved javascript data to: ";     if [[ "${display_id}" != "" ]]; then         echo "${prefix}(${display_id}) $TMPFILE" >&2;     else         echo "${prefix}$TMPFILE" >&2;     fi; }
export NOTEBOOK_BASH_KERNEL_CAPABILITIES="image,html,javascript"
{ echo $?; } 2>/dev/null
import os
os.environ["JUPYTER_PWD"] = "/home/user/"
{ echo $?; } 2>/dev/null
pwd
{ echo $?; } 2>/dev/null
import os
os.environ["JUPYTER_PWD"] = "/home/user/"
{ echo $?; } 2>/dev/null
git branch
git push -f https://$GITHUB_TOKEN@github.com/elimike10/ai-chatbot.git main-4-37a04fa9-fix
exit
